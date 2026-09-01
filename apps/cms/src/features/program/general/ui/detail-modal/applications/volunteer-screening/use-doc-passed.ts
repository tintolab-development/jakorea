import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerDocPassedApplicants,
  sortGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import { getGeneralParticipantDocPassedApplicants } from '@/data/mock/general-individual-applications-mock'
import { mapParticipantsToVolunteerScreeningRows } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { screeningWithdrawCompleteContent } from '@/features/program/general/lib/screening-subject-kind'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  filterGeneralDocPassedApplicants,
  type GeneralVolunteerDocPassedFilters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
import { assignGeneralVolunteerInterview } from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
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
  const loadRows = useCallback(() => {
    if (subjectKind === 'participant') {
      return mapParticipantsToVolunteerScreeningRows(
        getGeneralParticipantDocPassedApplicants(programId)
      )
    }
    return getGeneralVolunteerDocPassedApplicants(programId)
  }, [programId, subjectKind])

  // remote ON이면 mock으로 채우지 않음 (잘못된 목록 플래시 방지)
  const remoteSeed =
    subjectKind === 'volunteer' &&
    shouldUseGeneralApplicationsRemoteApi() &&
    Boolean(programId)
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    remoteSeed ? [] : loadRows()
  )
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'docPassed',
    enabled: subjectKind === 'volunteer',
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
    setList(loadRows())
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setViewMode('list')
  }, [loadRows, volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(() => {
    const filtered = filterGeneralDocPassedApplicants(list, appliedFilters)
    return sortGeneralVolunteerDocPassedApplicants(filtered)
  }, [appliedFilters, list])

  const calendarEvents = useMemo(
    () => mapGeneralVolunteerInterviewAvailabilityToCalendarEvents(tableData),
    [tableData]
  )

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleAssignInterview = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerAssignInterview(row)) return
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

      if (subjectKind === 'volunteer' && shouldUseGeneralApplicationsRemoteApi()) {
        const slotTimes = buildInterviewSlotTimesFromAssignPayload(payload)
        if (!slotTimes) {
          showAlert({
            title: '면접 배정 실패',
            content: '면접 일시 형식을 확인할 수 없습니다. 다시 선택해 주세요.',
          })
          return
        }
        try {
          await assignGeneralVolunteerInterview({
            programId,
            applicationId: target.id,
            ...slotTimes,
          })
          await volunteerRemote.invalidateVolunteerApplications?.()
        } catch (error) {
          console.debug('volunteer interview assign remote failed', error)
          showAlert({
            title: '면접 배정 실패',
            content: '면접 일정 배정 중 오류가 발생했습니다. 다시 시도해 주세요.',
          })
          return
        }
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

  const confirmWithdrawActivity = useCallback((_payload: ActivityWithdrawScheduleModalPayload) => {
    if (!withdrawTargetId) return
    const row = list.find(item => item.id === withdrawTargetId)
    if (!row) {
      setWithdrawTargetId(null)
      return
    }
    updateRow(withdrawTargetId, { interviewAssignmentStatus: 'withdrawn' })
    showAlert({
      title: '활동 포기',
      content: screeningWithdrawCompleteContent(subjectKind, row.name),
    })
    setWithdrawTargetId(null)
  }, [list, showAlert, subjectKind, updateRow, withdrawTargetId])

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
