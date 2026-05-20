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
import { getProgramAdminDetailInfoTabUrl } from '@/features/program/general/lib/program-admin-detail-url'
import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import {
  canAccessAdminCommentInAdminDetail,
  canEditAdminMemberInfo,
  isMasterAdminUser,
  shouldShowCmsMemberInfoEditButton,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  draftToAdminCommentAndInstructorFeePatch,
  draftToAdminMemberRestrictedPatch,
  draftToAdminProvisionedInstructorBasicInfoPatch,
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
import { handleError } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { institutionHasRegisteredTeachers } from '@/features/user/shared/lib/institution-delete-guard'

const PERSONAL_INFO_REVEAL_MODAL_Z_INDEX = 1100

export type InstructorPermissionRevokeNotifyTiming = 'immediate' | 'manual'

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
  const currentUser = useAuthStore(state => state.user)

  const [tabState, setTabState] = useState<TabState>({ lnb: 'detail-info' })
  const { applications, enrollmentApplications, applicationsLoading, refetchApplications } =
    useUserDetailApplications(open, displayUser)

  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [institutionDeleteBlockedOpen, setInstitutionDeleteBlockedOpen] = useState(false)
  const [basicInfoEditing, setBasicInfoEditing] = useState(false)
  const [basicInfoDraft, setBasicInfoDraft] = useState<AdminProvisionedMemberBasicInfoDraft | null>(
    null
  )
  const [basicInfoSaveLoading, setBasicInfoSaveLoading] = useState(false)
  const [adminPermissionVariantPatching, setAdminPermissionVariantPatching] = useState(false)
  const [instructorPermissionRevokeOpen, setInstructorPermissionRevokeOpen] = useState(false)

  useUserDetailUrlSync({
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    setTabState,
    programsChildQueryKey,
  })

  const resolvePersonalInfoAccessItem = useCallback(
    () =>
      displayUser?.schoolInfo?.schoolName?.trim() || displayUser?.name || '회원 상세 정보',
    [displayUser?.name, displayUser?.schoolInfo?.schoolName]
  )

  const {
    personalInfoRevealed,
    personalInfoRevealConfirmOpen,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [open, displayUser?.id],
    controlMode: 'hideWhenRevealed',
    modalZIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
  })

  useEffect(() => {
    if (!open) {
      setBasicInfoEditing(false)
      setBasicInfoDraft(null)
      setBasicInfoSaveLoading(false)
      setAdminPermissionVariantPatching(false)
      setInstructorPermissionRevokeOpen(false)
      setInstitutionDeleteBlockedOpen(false)
    }
  }, [open])

  useEffect(() => {
    setBasicInfoEditing(false)
    setBasicInfoDraft(null)
    setBasicInfoSaveLoading(false)
    setAdminPermissionVariantPatching(false)
    setInstructorPermissionRevokeOpen(false)
    setInstitutionDeleteBlockedOpen(false)
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
    if (
      displayUser?.role === 'SCHOOL' &&
      institutionHasRegisteredTeachers(displayUser)
    ) {
      setInstitutionDeleteBlockedOpen(true)
      return
    }
    setWithdrawConfirmOpen(true)
  }, [displayUser])

  const closeWithdrawConfirm = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const closeInstitutionDeleteBlocked = useCallback(() => {
    setInstitutionDeleteBlockedOpen(false)
  }, [])

  const handleWithdrawConfirm = useCallback(() => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
    }
  }, [displayUser, onWithdraw])

  const startBasicInfoEdit = useCallback(() => {
    if (!displayUser) return
    const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
    const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, displayUser.role)

    if (displayUser.role === 'SCHOOL' && bodyKey === 'institution') {
      if (shouldShowCmsMemberInfoEditButton(displayUser)) {
        setBasicInfoDraft(userToSchoolInstitutionEditDraft(displayUser))
      } else {
        setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
      }
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

    if (displayUser.role === 'INSTRUCTOR' && bodyKey === 'instructor') {
      if (shouldShowCmsMemberInfoEditButton(displayUser)) {
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(displayUser))
      } else {
        setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
      }
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

    if (bodyKey === 'admin') {
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
      if (canEditAdminMemberInfo(currentUser, displayUser)) {
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(displayUser))
      } else {
        setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
      }
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

    if (bodyKey !== 'all_users') return
    if (shouldShowCmsMemberInfoEditButton(displayUser)) {
      setBasicInfoDraft(userToAdminProvisionedBasicDraft(displayUser))
    } else {
      setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
    }
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
    if (displayUser.role === 'ADMIN' && !canAccessAdminCommentInAdminDetail(currentUser)) return
    setBasicInfoSaveLoading(true)
    try {
      let patch: PatchUserBasicInfoInput
      if (!shouldShowCmsMemberInfoEditButton(displayUser)) {
        patch =
          displayUser.role === 'INSTRUCTOR'
            ? draftToAdminCommentAndInstructorFeePatch(basicInfoDraft)
            : displayUser.role === 'ADMIN'
              ? draftToAdminMemberRestrictedPatch(basicInfoDraft)
              : draftToSchoolAdminCommentOnlyPatch(basicInfoDraft)
      } else if (displayUser.role === 'SCHOOL') {
        patch = draftToSchoolInstitutionBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'INSTRUCTOR') {
        patch = draftToAdminProvisionedInstructorBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'ADMIN') {
        patch =
          isMasterAdminUser(currentUser) && shouldShowCmsMemberInfoEditButton(displayUser)
            ? draftToBasicInfoPatch(basicInfoDraft)
            : draftToAdminMemberRestrictedPatch(basicInfoDraft)
      } else {
        patch = draftToBasicInfoPatch(basicInfoDraft)
      }
      const updated = await patchMemberBasicInfo(displayUser.id, patch)
      setBasicInfoEditing(false)
      setBasicInfoDraft(null)
      onMemberBasicInfoSaved?.(updated)
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
    currentUser,
  ])

  const updateBasicInfoDraft = useCallback((partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => {
    setBasicInfoDraft(prev => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const patchAdminPermissionVariantFromDetailView = useCallback(
    async (nextPermission: AdminPermissionTagVariant) => {
      if (!displayUser || displayUser.role !== 'ADMIN') return
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
      if (!patchMemberBasicInfo) return
      const current = getAdminPermissionVariant(displayUser)
      if (nextPermission === current) return
      setAdminPermissionVariantPatching(true)
      try {
        const updated = await patchMemberBasicInfo(displayUser.id, {
          listMetrics: { adminPermissionVariant: nextPermission },
        })
        onMemberBasicInfoSaved?.(updated)
        } catch (error) {
        handleError(error, { defaultMessage: '관리자 권한 유형 변경에 실패했습니다.' })
      } finally {
        setAdminPermissionVariantPatching(false)
      }
    },
    [displayUser, currentUser, patchMemberBasicInfo, onMemberBasicInfoSaved]
  )

  const openInstructorPermissionRevoke = useCallback(() => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    setInstructorPermissionRevokeOpen(true)
  }, [displayUser])

  const closeInstructorPermissionRevoke = useCallback(() => {
    setInstructorPermissionRevokeOpen(false)
  }, [])

  const confirmInstructorPermissionRevoke = useCallback(
    (_payload: { reason: string; notifyTiming: InstructorPermissionRevokeNotifyTiming }) => {
      // TODO(api): 강사 권한 박탈 API 연동 후 alert 제거·실제 처리로 교체
      window.alert('준비 중입니다.')
      setInstructorPermissionRevokeOpen(false)
    },
    []
  )

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

  const canPatchAdminPermissionInDetailView = useMemo(
    () =>
      Boolean(
        patchMemberBasicInfo &&
          displayUser?.role === 'ADMIN' &&
          canAccessAdminCommentInAdminDetail(currentUser)
      ),
    [patchMemberBasicInfo, displayUser?.role, currentUser]
  )

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
      institutionDeleteBlockedOpen,
      personalInfoRevealed,
      personalInfoRevealConfirmOpen,
      basicInfoEditing,
      basicInfoDraft,
      basicInfoSaveLoading,
      adminPermissionVariantPatching,
      instructorPermissionRevokeOpen,
      personalInfoRevealModal,
    },
    actions: {
      setTabState,
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
      closeInstitutionDeleteBlocked,
      handleWithdrawConfirm,
      openPersonalInfoRevealConfirm,
      closePersonalInfoRevealConfirm,
      submitPersonalInfoReveal,
      startBasicInfoEdit,
      cancelBasicInfoEdit,
      saveBasicInfoEdit,
      updateBasicInfoDraft,
      patchAdminPermissionVariantFromDetailView,
      openInstructorPermissionRevoke,
      closeInstructorPermissionRevoke,
      confirmInstructorPermissionRevoke,
    },
    derived: {
      role,
      sidebarItems,
      sidebarExpandedGroupKeys,
      sidebarActiveChildKey,
      instructorResumeApplicantRow,
      canPatchAdminPermissionInDetailView,
    },
  }
}
