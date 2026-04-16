import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Application, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { applicationService } from '@/entities/application/api/application-service'
import { mockUserHistories } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import {
  maskedUserForInstructorDetail,
  userToApplicantInstructorRow,
} from '@/features/user/shared/lib/user-to-applicant-instructor-row'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  programsHistoryHasChildMenu,
  clampProgramsChildForUser,
  instructorDetailLnbClickShowsPrepareMessage,
  type TabState,
  type UserDetailLnbKey,
  type UserDetailProgramsChildKey,
} from './user-detail-fullpage-helpers'
import { buildUserDetailSidebarItems } from '../ui/detail-info/user-detail-fullpage-sidebar-items'
import { useUserDetailApplications } from './use-user-detail-applications'
import { useUserDetailUrlSync } from './use-user-detail-url-sync'
import type { UseUserDetailModalsResult } from './use-user-detail-modals'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramAdminDetailInfoTabUrl } from '@/features/program/lib/program-admin-detail-url'
import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import { shouldShowCmsMemberInfoEditButton } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  draftToBasicInfoPatch,
  draftToSchoolAdminCommentOnlyPatch,
  draftToSchoolInstitutionBasicInfoPatch,
  userToAdminCommentOnlyDraft,
  userToAdminProvisionedBasicDraft,
  userToSchoolInstitutionEditDraft,
  type AdminProvisionedMemberBasicInfoDraft,
} from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  resolveUserBasicInfoBodyKey,
  parseUserBasicInfoEntryQuery,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import { MESSAGES } from '@/shared/constants'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { trackPersonalInfoAccess } from '@/features/logs/lib/personal-info-access-tracker'

export type UserDetailControllerModalMode = 'default' | 'permission'

export interface UseUserDetailControllerParams {
  open: boolean
  displayUser: Omit<User, 'password'> | null
  mode: UserDetailControllerModalMode
  programsChildQueryKey: string
  basicInfoEntrySource?: UserBasicInfoEntrySource
  onWithdraw?: (user: Omit<User, 'password'>) => void
  modals: UseUserDetailModalsResult
  patchMemberBasicInfo?: (
    userId: string,
    patch: PatchUserBasicInfoInput
  ) => Promise<Omit<User, 'password'>>
  onMemberBasicInfoSaved?: (user: Omit<User, 'password'>) => void
}

export function useUserDetailController({
  open,
  displayUser,
  mode,
  programsChildQueryKey,
  basicInfoEntrySource,
  onWithdraw,
  modals,
  patchMemberBasicInfo,
  onMemberBasicInfoSaved,
}: UseUserDetailControllerParams) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tabState, setTabState] = useState<TabState>({ lnb: 'detail-info' })
  const { applications, enrollmentApplications, applicationsLoading, refetchApplications } =
    useUserDetailApplications(open, displayUser)

  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)
  const [personalInfoRevealConfirmOpen, setPersonalInfoRevealConfirmOpen] = useState(false)
  const [basicInfoEditing, setBasicInfoEditing] = useState(false)
  const [basicInfoDraft, setBasicInfoDraft] = useState<AdminProvisionedMemberBasicInfoDraft | null>(
    null
  )
  const [basicInfoSaveLoading, setBasicInfoSaveLoading] = useState(false)

  useUserDetailUrlSync({
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    setTabState,
    programsChildQueryKey,
  })

  useEffect(() => {
    if (!open) {
      setPersonalInfoRevealed(false)
      setPersonalInfoRevealConfirmOpen(false)
      setBasicInfoEditing(false)
      setBasicInfoDraft(null)
      setBasicInfoSaveLoading(false)
    }
  }, [open])

  useEffect(() => {
    setPersonalInfoRevealed(false)
    setPersonalInfoRevealConfirmOpen(false)
    setBasicInfoEditing(false)
    setBasicInfoDraft(null)
    setBasicInfoSaveLoading(false)
  }, [displayUser?.id])

  useEffect(() => {
    if (open && displayUser) {
      setVolunteerHistoriesLoading(true)
      try {
        const histories = mockUserHistories.filter(
          h => h.userId === displayUser.id && h.finalStatus !== 'CANCELLED'
        )
        histories.sort((a, b) => dayjs(b.completedAt).diff(dayjs(a.completedAt)))
        setVolunteerHistories(histories)
      } catch (error) {
        console.error('Failed to load user histories:', error)
        setVolunteerHistories([])
      } finally {
        setVolunteerHistoriesLoading(false)
      }
    } else {
      setVolunteerHistories([])
    }
  }, [open, displayUser])

  const handleProgressStatusChange = useCallback(
    async (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => {
      if (!displayUser) return
      try {
        if (displayStatus === 'REJECTED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'APPLICATION',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'INTERVIEW_FAILED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'INTERVIEW',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'WAITING_RESULT') {
          await applicationService.update(app.id, {
            status: 'submitted',
            rejectionKind: undefined,
            progressStatus: undefined,
          })
        } else if (displayStatus === 'DOCUMENT_PASS') {
          await applicationService.update(app.id, {
            status: 'reviewing',
            rejectionKind: undefined,
          })
        } else {
          const progressMap: Record<
            Exclude<
              ProgramEnrollmentDisplayStatus,
              'REJECTED' | 'INTERVIEW_FAILED' | 'WAITING_RESULT' | 'DOCUMENT_PASS'
            >,
            ApplicationProgressStatus
          > = {
            EDUCATION_SCHEDULED: 'RECEIVED',
            EDUCATION_IN_PROGRESS: 'IN_PROGRESS',
            PROGRAM_ENDED: 'REPORT_SUBMITTED',
          }
          await applicationService.update(app.id, {
            status: 'approved',
            progressStatus: progressMap[displayStatus],
            rejectionKind: undefined,
          })
        }
        await refetchApplications()
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser, refetchApplications]
  )

  const openWithdrawConfirm = useCallback(() => {
    setWithdrawConfirmOpen(true)
  }, [])

  const closeWithdrawConfirm = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const handleWithdrawConfirm = useCallback(() => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
    }
  }, [displayUser, onWithdraw])

  const openPersonalInfoRevealConfirm = useCallback(() => {
    setPersonalInfoRevealConfirmOpen(true)
  }, [])

  const closePersonalInfoRevealConfirm = useCallback(() => {
    setPersonalInfoRevealConfirmOpen(false)
  }, [])

  const submitPersonalInfoReveal = useCallback((reason: string) => {
    const accessItem = displayUser?.schoolInfo?.schoolName?.trim() || displayUser?.name || '회원 상세 정보'
    trackPersonalInfoAccess(accessItem, reason)
    setPersonalInfoRevealed(true)
    setPersonalInfoRevealConfirmOpen(false)
  }, [displayUser?.name, displayUser?.schoolInfo?.schoolName])

  const startBasicInfoEdit = useCallback(() => {
    if (!displayUser) return
    const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
    const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, displayUser.role)

    if (displayUser.role === 'SCHOOL' && bodyKey === 'institution') {
      setBasicInfoDraft(userToSchoolInstitutionEditDraft(displayUser))
      setBasicInfoEditing(true)
      setTabState({ lnb: 'detail-info' })
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', 'detail-info')
          nextParams.delete(programsChildQueryKey)
          return nextParams
        },
        { replace: true }
      )
      return
    }

    const instructorProfile = resolveInstructorMemberProfile(displayUser)
    if (
      displayUser.role === 'INSTRUCTOR' &&
      instructorProfile === 'school_teacher' &&
      bodyKey === 'instructor'
    ) {
      setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
      setBasicInfoEditing(true)
      setTabState({ lnb: 'detail-info' })
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', 'detail-info')
          nextParams.delete(programsChildQueryKey)
          return nextParams
        },
        { replace: true }
      )
      return
    }

    if (!shouldShowCmsMemberInfoEditButton(displayUser) || bodyKey !== 'all_users') {
      return
    }
    setBasicInfoDraft(userToAdminProvisionedBasicDraft(displayUser))
    setBasicInfoEditing(true)
    setTabState({ lnb: 'detail-info' })
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        if (displayUser.id) nextParams.set('id', displayUser.id)
        nextParams.set('lnb', 'detail-info')
        nextParams.delete(programsChildQueryKey)
        return nextParams
      },
      { replace: true }
    )
  }, [
    displayUser,
    basicInfoEntrySource,
    searchParams,
    programsChildQueryKey,
    setSearchParams,
  ])

  const cancelBasicInfoEdit = useCallback(() => {
    setBasicInfoEditing(false)
    setBasicInfoDraft(null)
  }, [])

  const saveBasicInfoEdit = useCallback(async () => {
    if (!displayUser || !basicInfoDraft || !patchMemberBasicInfo) return
    setBasicInfoSaveLoading(true)
    try {
      let patch: PatchUserBasicInfoInput
      if (displayUser.role === 'SCHOOL') {
        patch = draftToSchoolInstitutionBasicInfoPatch(basicInfoDraft)
      } else if (
        displayUser.role === 'INSTRUCTOR' &&
        resolveInstructorMemberProfile(displayUser) === 'school_teacher'
      ) {
        patch = draftToSchoolAdminCommentOnlyPatch(basicInfoDraft)
      } else {
        patch = draftToBasicInfoPatch(basicInfoDraft)
      }
      const updated = await patchMemberBasicInfo(displayUser.id, patch)
      setBasicInfoEditing(false)
      setBasicInfoDraft(null)
      onMemberBasicInfoSaved?.(updated)
      showSuccessMessage(MESSAGES.success.updated)
    } catch (error) {
      handleError(error, { defaultMessage: '회원 정보 저장에 실패했습니다.' })
    } finally {
      setBasicInfoSaveLoading(false)
    }
  }, [
    displayUser,
    basicInfoDraft,
    patchMemberBasicInfo,
    onMemberBasicInfoSaved,
  ])

  const updateBasicInfoDraft = useCallback((partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => {
    setBasicInfoDraft(prev => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (mode === 'permission') {
        setTabState({ lnb: 'detail-info' })
        return
      }
      if (!displayUser) return
      const k = key as UserDetailLnbKey

      if (k === 'payment-status') {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'payment-top')) {
          window.alert('준비 중입니다.')
          return
        }
      }

      if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'history-top')) {
          window.alert('준비 중입니다.')
          return
        }
        setTabState({ lnb: 'history', child: 'enrollment' })
      } else {
        setTabState({ lnb: k })
      }

      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', k)
          if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
            nextParams.set(programsChildQueryKey, 'enrollment')
          } else {
            nextParams.delete(programsChildQueryKey)
          }
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const handleSidebarSelectChild = useCallback(
    (_groupKey: string, childKey: string) => {
      if (mode === 'permission') return
      if (!displayUser) return
      const child = clampProgramsChildForUser(displayUser, childKey as UserDetailProgramsChildKey)
      if (
        instructorDetailLnbClickShowsPrepareMessage(displayUser, 'history', 'history-child', child)
      ) {
        window.alert('준비 중입니다.')
        return
      }
      setTabState({ lnb: 'history', child })
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', 'history')
          nextParams.set(programsChildQueryKey, child)
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const openEnrollmentProgramDetail = useCallback(
    (record: Application) => {
      navigate(getProgramAdminDetailInfoTabUrl(record.programId))
    },
    [navigate]
  )

  const sidebarItems = useMemo(
    () => buildUserDetailSidebarItems(displayUser ?? undefined, mode),
    [displayUser, mode]
  )

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (!displayUser || !programsHistoryHasChildMenu(displayUser)) return [] as const
    if (displayUser.role === 'INSTRUCTOR') {
      const p = resolveInstructorMemberProfile(displayUser)
      if (p === 'instructor_only') {
        if (tabState.lnb === 'payment-status') return [] as const
        return ['history'] as const
      }
    }
    if (tabState.lnb !== 'history') return [] as const
    return ['history'] as const
  }, [tabState.lnb, displayUser])

  const sidebarActiveChildKey = useMemo(
    () =>
      tabState.lnb === 'history' && displayUser && programsHistoryHasChildMenu(displayUser)
        ? (tabState.child ?? 'enrollment')
        : '',
    [tabState.lnb, tabState.child, displayUser]
  )

  const role = displayUser?.role

  const instructorResumeApplicantRow = useMemo((): ApplicantInstructorRow | null => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return null
    const profile = resolveInstructorMemberProfile(displayUser)
    if (profile !== 'instructor_dual' && profile !== 'instructor_only') return null
    const src = personalInfoRevealed ? displayUser : maskedUserForInstructorDetail(displayUser)
    return userToApplicantInstructorRow(src)
  }, [displayUser, personalInfoRevealed])

  return {
    state: {
      tabState,
      applications,
      enrollmentApplications,
      applicationsLoading,
      volunteerHistories,
      volunteerHistoriesLoading,
      withdrawConfirmOpen,
      personalInfoRevealed,
      personalInfoRevealConfirmOpen,
      basicInfoEditing,
      basicInfoDraft,
      basicInfoSaveLoading,
    },
    actions: {
      setTabState,
      setPersonalInfoRevealed,
      handleProgressStatusChange,
      handleSidebarSelectTop,
      handleSidebarSelectChild,
      openLectureAttendance: modals.lectureAttendance.show,
      openAssignmentSubmission: modals.assignment.show,
      closeLectureAttendanceModal: modals.lectureAttendance.close,
      closeAssignmentSubmissionModal: modals.assignment.close,
      openEnrollmentProgramDetail,
      openWithdrawConfirm,
      closeWithdrawConfirm,
      handleWithdrawConfirm,
      openPersonalInfoRevealConfirm,
      closePersonalInfoRevealConfirm,
      submitPersonalInfoReveal,
      startBasicInfoEdit,
      cancelBasicInfoEdit,
      saveBasicInfoEdit,
      updateBasicInfoDraft,
    },
    derived: {
      role,
      sidebarItems,
      sidebarExpandedGroupKeys,
      sidebarActiveChildKey,
      instructorResumeApplicantRow,
    },
  }
}
