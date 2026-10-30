import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { buildGeneralVolunteerDocPassedListQuery } from '@/features/program/general/api/volunteer-list-query'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { toNestedDecisionNotification } from '@/features/program/general/lib/application-decision-notify-timing'
import type { VolunteerDocumentCancelRejectionConfirmPayload } from '@/features/program/general/lib/volunteer-document-cancel-rejection'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { MESSAGES } from '@/shared/constants/messages'
import {
  sortGeneralParticipantDocPassedVolunteerRows,
  sortGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/features/program/general/model/volunteer-applicant'
import {
  screeningWithdrawCompleteContent,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  filterGeneralDocPassedApplicants,
  type GeneralVolunteerDocPassedFilters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
import {
  assignGeneralIndividualInterview,
  assignGeneralVolunteerInterview,
} from '@/features/program/general/api/admin-applications-service'
import { toInterviewAssignNotifyFields } from '@/features/program/general/lib/application-decision-notify-timing'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { buildInterviewSlotTimesFromAssignPayload } from '@/features/program/general/lib/interview-slot-from-assign-payload'
import {
  guardGeneralVolunteerAssignInterview,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'
import type { ApplicationGiveUpReasonModalPayload } from '@/features/program/shared/ui/application-give-up-reason-modal'
import type { GeneralInterviewAssignConfirmPayload } from './general-volunteer-interview-assign-modal'
import { useGeneralVolunteerDocPassedColumns } from './doc-passed-columns'
import {
  countInterviewAvailabilitySlots,
  mergeAssignedInterviewIntoAvailability,
} from '@/features/program/general/lib/interview-availability-utils'
import { mapGeneralVolunteerInterviewAvailabilityToCalendarEvents } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import { getNotificationScheduleError } from '@/shared/lib/notification-schedule'

export type GeneralVolunteerDocPassedViewMode = 'list' | 'calendar'

export type GeneralInterviewAssignPickFlow = {
  type: 'pick'
  target: GeneralVolunteerApplicantRow
}

export type GeneralInterviewAssignCompleteFlow = {
  type: 'complete'
  applicantName: string
  mode: 'assign' | 'reassign'
  payload: GeneralInterviewAssignConfirmPayload
}

export type GeneralInterviewAssignFlow =
  | GeneralInterviewAssignPickFlow
  | GeneralInterviewAssignCompleteFlow

export function useGeneralVolunteerDocPassed({
  programId,
  subjectKind = 'volunteer',
}: {
  programId: string
  subjectKind?: ScreeningSubjectKind
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseGeneralApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-volunteer-doc-passed',
    '프로그램 신청 · 봉사자 1차 서류 합격자'
  )
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() => [])
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const listQuery = useMemo(
    () => buildGeneralVolunteerDocPassedListQuery(appliedFilters),
    [appliedFilters]
  )
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'docPassed',
    subjectKind,
    enabled: true,
    listQuery: subjectKind === 'volunteer' ? listQuery : undefined,
    setList,
  })
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<GeneralVolunteerDocPassedViewMode>('list')
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [cancelApprovalTargetId, setCancelApprovalTargetId] = useState<string | null>(null)
  const [cancelRejectTargetId, setCancelRejectTargetId] = useState<string | null>(null)
  const [assignFlow, setAssignFlow] = useState<GeneralInterviewAssignFlow | null>(null)
  const assignFlowRef = useRef(assignFlow)
  assignFlowRef.current = assignFlow

  useEffect(() => {
    if (volunteerRemote.remoteEnabled) return
    setList([])
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setViewMode('list')
  }, [programId, subjectKind, volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(() => {
    const filtered =
      volunteerRemote.remoteEnabled && subjectKind === 'volunteer'
        ? list
        : filterGeneralDocPassedApplicants(list, appliedFilters)
    if (subjectKind === 'participant') {
      return sortGeneralParticipantDocPassedVolunteerRows(filtered)
    }
    return sortGeneralVolunteerDocPassedApplicants(filtered)
  }, [appliedFilters, list, subjectKind, volunteerRemote.remoteEnabled])

  const calendarEvents = useMemo(
    () => mapGeneralVolunteerInterviewAvailabilityToCalendarEvents(tableData),
    [tableData]
  )

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleAssignInterview = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (!guardGeneralVolunteerAssignInterview(row)) return
      if (!shouldUseGeneralApplicationsRemoteApi()) {
        notifyProgramApiUnavailable('general-volunteer-interview-assign', '봉사자 면접일 배정')
        return
      }
      setAssignFlow({ type: 'pick', target: row })
    },
    [programId]
  )

  const closeAssignModal = useCallback(() => {
    setAssignFlow(current => (current?.type === 'pick' ? null : current))
  }, [])

  const confirmAssignInterview = useCallback(
    async (payload: GeneralInterviewAssignConfirmPayload) => {
      const flow = assignFlowRef.current
      if (!flow || flow.type !== 'pick') return

      const { target } = flow
      const wasAssigned = target.interviewAssignmentStatus === 'assigned'

      if (!shouldUseGeneralApplicationsRemoteApi()) {
        notifyProgramApiUnavailable('general-volunteer-interview-assign', '봉사자 면접일 배정')
        return
      }

      const slotTimes = buildInterviewSlotTimesFromAssignPayload(payload)
      if (!slotTimes) {
        showAlert({
          title: '면접 배정 실패',
          content: '면접 일시 형식을 확인할 수 없습니다. 다시 선택해 주세요.',
        })
        return
      }
      let interviewAssignmentId: number | undefined
      try {
        const assignNotify = toInterviewAssignNotifyFields(
          payload.notifyTiming,
          payload.manualNotifyAt
        )
        if (subjectKind === 'participant') {
          const assignment = await assignGeneralIndividualInterview({
            programId,
            applicationId: target.id,
            ...slotTimes,
            ...assignNotify,
          })
          interviewAssignmentId = assignment.interviewAssignmentId
        } else {
          const assignment = await assignGeneralVolunteerInterview({
            programId,
            applicationId: target.id,
            ...slotTimes,
            ...assignNotify,
          })
          interviewAssignmentId = assignment.interviewAssignmentId
        }
        if (interviewAssignmentId == null) {
          showAlert({
            title: '면접 배정 실패',
            content: '면접 배정 ID를 확인할 수 없습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
          })
          return
        }
        const interviewAvailability = mergeAssignedInterviewIntoAvailability({
          ...target,
          interviewAssignmentStatus: 'assigned',
          assignedInterviewDateLabel: payload.dateLabel,
          assignedInterviewTime: payload.timeRange,
        })

        updateRow(target.id, {
          interviewAssignmentStatus: 'assigned',
          interviewAssignmentId,
          assignedInterviewDateLabel: payload.dateLabel,
          assignedInterviewTime: payload.timeRange,
          secondInterviewScreeningStatus: target.secondInterviewScreeningStatus ?? 'waiting',
          interviewAvailability,
          interviewSlotCount: countInterviewAvailabilitySlots(interviewAvailability),
        })

        await queryClient.invalidateQueries({
          queryKey:
            subjectKind === 'participant'
              ? generalApplicationsQueryKeys.individualDetail(target.id)
              : generalApplicationsQueryKeys.volunteerDetail(target.id),
        })
        await volunteerRemote.invalidateVolunteerApplications?.()
      } catch (error) {
        console.debug('interview assign remote failed', error)
        const scheduleError = getNotificationScheduleError(error)
        showAlert({
          title: '면접 배정 실패',
          content:
            scheduleError?.message ?? '면접 일정 배정 중 오류가 발생했습니다. 다시 시도해 주세요.',
        })
        return
      }

      setAssignFlow({
        type: 'complete',
        applicantName: target.name,
        mode: wasAssigned ? 'reassign' : 'assign',
        payload,
      })
    },
    [programId, queryClient, showAlert, subjectKind, updateRow, volunteerRemote]
  )

  const closeAssignCompleteModal = useCallback(() => {
    setAssignFlow(null)
  }, [])

  const requestWithdrawActivity = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerWithdrawActivity(row)) return
    setWithdrawTargetId(row.id)
  }, [])

  const cancelWithdrawActivity = useCallback(() => {
    setWithdrawTargetId(null)
  }, [])

  const confirmWithdrawActivity = useCallback(
    async (payload: ApplicationGiveUpReasonModalPayload) => {
      if (!withdrawTargetId) return
      const row = list.find(item => item.id === withdrawTargetId)
      if (!row) {
        setWithdrawTargetId(null)
        return
      }
      if (!volunteerRemote.remoteEnabled) {
        notifyProgramApiUnavailable('general-volunteer-give-up', '봉사자 활동 포기')
        setWithdrawTargetId(null)
        return
      }
      const handled = await volunteerRemote.applyRemoteGiveUp?.(withdrawTargetId, {
        reason: payload.reason,
      })
      setWithdrawTargetId(null)
      if (!handled) return
      showAlert({
        title: '활동 포기',
        content: screeningWithdrawCompleteContent(subjectKind, row.name),
      })
    },
    [list, showAlert, subjectKind, volunteerRemote, withdrawTargetId]
  )

  const withdrawTarget = useMemo(
    () => (withdrawTargetId ? list.find(row => row.id === withdrawTargetId) : undefined),
    [list, withdrawTargetId]
  )

  const cancelApprovalVolunteer = useMemo(
    () =>
      cancelApprovalTargetId ? (list.find(row => row.id === cancelApprovalTargetId) ?? null) : null,
    [cancelApprovalTargetId, list]
  )

  const cancelRejectVolunteer = useMemo(
    () =>
      cancelRejectTargetId ? (list.find(row => row.id === cancelRejectTargetId) ?? null) : null,
    [cancelRejectTargetId, list]
  )

  const applyDocumentScreeningCancelApproval = useCallback(
    async (
      id: string,
      reason: string,
      notification?: import('@/features/program/general/api/applications-api-client').InstructorApplicationNotificationRequest
    ) => {
      if (volunteerRemote.remoteEnabled) {
        return volunteerRemote.applyRemoteDocumentCancelApproval(id, reason, notification)
      }
      notifyProgramApiUnavailable(
        'general-volunteer-document-cancel-approval',
        '봉사자 서류 승인 취소'
      )
      return false
    },
    [volunteerRemote]
  )

  const applyDocumentScreeningCancelRejection = useCallback(
    async (
      id: string,
      reason: string,
      notification?: import('@/features/program/general/api/applications-api-client').InstructorApplicationNotificationRequest
    ) => {
      if (volunteerRemote.remoteEnabled) {
        return volunteerRemote.applyRemoteDocumentCancelRejection(id, reason, notification)
      }
      notifyProgramApiUnavailable(
        'general-volunteer-document-cancel-rejection',
        '봉사자 서류 반려 취소'
      )
      return false
    },
    [volunteerRemote]
  )

  const openCancelApprovalModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setCancelApprovalTargetId(applicant.id)
  }, [])

  const openCancelRejectModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setCancelRejectTargetId(applicant.id)
  }, [])

  const closeCancelApprovalModal = useCallback(() => {
    setCancelApprovalTargetId(null)
  }, [])

  const closeCancelRejectModal = useCallback(() => {
    setCancelRejectTargetId(null)
  }, [])

  const handleCancelApprovalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!cancelApprovalVolunteer) return
      const ok = await applyDocumentScreeningCancelApproval(
        cancelApprovalVolunteer.id,
        payload.reason,
        toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)?.notification
      )
      if (!ok) return
      setCancelApprovalTargetId(null)
      // Figma 「Popup / Text / w600 / 공통 완료」 (1차 서류 승인 취소 완료)
      showAlert({ title: '취소 완료', content: MESSAGES.success.cancelled })
    },
    [applyDocumentScreeningCancelApproval, cancelApprovalVolunteer, showAlert]
  )

  const handleCancelRejectConfirm = useCallback(
    async (payload: VolunteerDocumentCancelRejectionConfirmPayload) => {
      if (!cancelRejectVolunteer) return
      const reason = payload.variant === 'alreadySent' ? payload.reason : '반려 취소'
      const notification =
        payload.variant === 'alreadySent'
          ? toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)?.notification
          : undefined
      const ok = await applyDocumentScreeningCancelRejection(
        cancelRejectVolunteer.id,
        reason,
        notification
      )
      if (!ok) return
      setCancelRejectTargetId(null)
    },
    [applyDocumentScreeningCancelRejection, cancelRejectVolunteer]
  )

  const columns = useGeneralVolunteerDocPassedColumns({
    onAssignInterview: handleAssignInterview,
    subjectKind,
  })

  const handleViewCalendar = useCallback(() => {
    setViewMode('calendar')
  }, [])

  const handleViewList = useCallback(() => {
    setViewMode('list')
  }, [])

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count:
      volunteerRemote.remoteEnabled && volunteerRemote.listTotalElements != null
        ? volunteerRemote.listTotalElements
        : tableData.length,
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    cancelApprovalVolunteer,
    cancelRejectVolunteer,
    closeCancelApprovalModal,
    closeCancelRejectModal,
    openCancelApprovalModal,
    openCancelRejectModal,
    handleCancelApprovalConfirm,
    handleCancelRejectConfirm,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    applicationsLoading: volunteerRemote.applicationsLoading,
    isRemoteDataSource: volunteerRemote.remoteEnabled,
    hasNextPage: volunteerRemote.hasNextPage,
    isFetchingNextPage: volunteerRemote.isFetchingNextPage,
    fetchNextPage: volunteerRemote.fetchNextPage,
  }
}
