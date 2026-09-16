import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
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
import { assignGeneralIndividualInterview, assignGeneralVolunteerInterview } from '@/features/program/general/api/admin-applications-service'
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
import type { ActivityWithdrawScheduleModalPayload } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import type { GeneralInterviewAssignConfirmPayload } from './general-volunteer-interview-assign-modal'
import { useGeneralVolunteerDocPassedColumns } from './doc-passed-columns'
import {
  countInterviewAvailabilitySlots,
  mergeAssignedInterviewIntoAvailability,
} from '@/features/program/general/lib/interview-availability-utils'
import { mapGeneralVolunteerInterviewAvailabilityToCalendarEvents } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'

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
  const remoteEnabled = shouldUseGeneralApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-volunteer-doc-passed',
    '프로그램 신청 · 봉사자 1차 서류 합격자'
  )
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() => [])
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'docPassed',
    subjectKind,
    enabled: true,
    setList,
  })
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<GeneralVolunteerDocPassedViewMode>('list')
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [assignFlow, setAssignFlow] = useState<GeneralInterviewAssignFlow | null>(null)
  const assignFlowRef = useRef(assignFlow)
  assignFlowRef.current = assignFlow

  useEffect(() => {
    if (volunteerRemote.remoteEnabled) return
    setList([])
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setViewMode('list')
  }, [volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(() => {
    const filtered = filterGeneralDocPassedApplicants(list, appliedFilters)
    if (subjectKind === 'participant') {
      return sortGeneralParticipantDocPassedVolunteerRows(filtered)
    }
    return sortGeneralVolunteerDocPassedApplicants(filtered)
  }, [appliedFilters, list, subjectKind])

  const calendarEvents = useMemo(
    () => mapGeneralVolunteerInterviewAvailabilityToCalendarEvents(tableData),
    [tableData]
  )

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleAssignInterview = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerAssignInterview(row)) return
    if (!shouldUseGeneralApplicationsRemoteApi()) {
      notifyProgramApiUnavailable('general-volunteer-interview-assign', '봉사자 면접일 배정')
      return
    }
    setAssignFlow({ type: 'pick', target: row })
  }, [])

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
      try {
        if (subjectKind === 'participant') {
          await assignGeneralIndividualInterview({
            programId,
            applicationId: target.id,
            ...slotTimes,
          })
        } else {
          await assignGeneralVolunteerInterview({
            programId,
            applicationId: target.id,
            ...slotTimes,
          })
        }
        await volunteerRemote.invalidateVolunteerApplications?.()
      } catch (error) {
        console.debug('interview assign remote failed', error)
        showAlert({
          title: '면접 배정 실패',
          content: '면접 일정 배정 중 오류가 발생했습니다. 다시 시도해 주세요.',
        })
        return
      }

      const assignedApplicant: GeneralVolunteerApplicantRow = {
        ...target,
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: payload.dateLabel,
        assignedInterviewTime: payload.timeRange,
        secondInterviewScreeningStatus: target.secondInterviewScreeningStatus ?? 'waiting',
      }
      const interviewAvailability = mergeAssignedInterviewIntoAvailability(assignedApplicant)

      updateRow(target.id, {
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: payload.dateLabel,
        assignedInterviewTime: payload.timeRange,
        secondInterviewScreeningStatus: target.secondInterviewScreeningStatus ?? 'waiting',
        interviewAvailability,
        interviewSlotCount: countInterviewAvailabilitySlots(interviewAvailability),
      })
      setAssignFlow({
        type: 'complete',
        applicantName: target.name,
        mode: wasAssigned ? 'reassign' : 'assign',
        payload,
      })
    },
    [programId, showAlert, subjectKind, updateRow, volunteerRemote]
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
    async (payload: ActivityWithdrawScheduleModalPayload) => {
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
      const handled = await volunteerRemote.applyRemoteGiveUp?.(
        withdrawTargetId,
        payload.stopScheduleLabel
      )
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
    count: tableData.length,
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    applicationsLoading: volunteerRemote.applicationsLoading,
    isRemoteDataSource: volunteerRemote.remoteEnabled,
  }
}
