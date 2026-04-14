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

export type UserDetailControllerModalMode = 'default' | 'permission'

export interface UseUserDetailControllerParams {
  open: boolean
  displayUser: Omit<User, 'password'> | null
  mode: UserDetailControllerModalMode
  programsChildQueryKey: string
  onClose: () => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  modals: UseUserDetailModalsResult
}

export function useUserDetailController({
  open,
  displayUser,
  mode,
  programsChildQueryKey,
  onClose,
  onWithdraw,
  modals,
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
    if (!open) setPersonalInfoRevealed(false)
  }, [open])

  useEffect(() => {
    setPersonalInfoRevealed(false)
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
      onClose()
    }
  }, [displayUser, onWithdraw, onClose])

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
