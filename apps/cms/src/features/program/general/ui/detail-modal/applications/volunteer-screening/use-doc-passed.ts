import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerDocPassedApplicants,
  sortGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  filterGeneralDocPassedApplicants,
  type GeneralVolunteerDocPassedFilters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  guardGeneralVolunteerAssignInterview,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'
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

export function useGeneralVolunteerDocPassed({ programId }: { programId: string }) {
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    getGeneralVolunteerDocPassedApplicants(programId)
  )
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
    setList(getGeneralVolunteerDocPassedApplicants(programId))
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setViewMode('list')
  }, [programId])

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
    (payload: GeneralInterviewAssignConfirmPayload) => {
      const flow = assignFlowRef.current
      if (!flow || flow.type !== 'pick') return

      const { target } = flow
      const wasAssigned = target.interviewAssignmentStatus === 'assigned'
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
    [updateRow]
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

  const confirmWithdrawActivity = useCallback(() => {
    if (!withdrawTargetId) return
    const row = list.find(item => item.id === withdrawTargetId)
    if (!row) {
      setWithdrawTargetId(null)
      return
    }
    updateRow(withdrawTargetId, { interviewAssignmentStatus: 'withdrawn' })
    showAlert({
      title: '활동 포기',
      content: `${row.name} 봉사자가 활동 포기 처리되었습니다.`,
    })
    setWithdrawTargetId(null)
  }, [list, showAlert, updateRow, withdrawTargetId])

  const withdrawTarget = useMemo(
    () => (withdrawTargetId ? list.find(row => row.id === withdrawTargetId) : undefined),
    [list, withdrawTargetId]
  )

  const columns = useGeneralVolunteerDocPassedColumns({ onAssignInterview: handleAssignInterview })

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
  }
}
