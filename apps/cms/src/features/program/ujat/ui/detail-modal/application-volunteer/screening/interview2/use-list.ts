import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import {
  getUjatVolunteerInterview2Applicants,
  patchUjatVolunteerInterviewEvaluation,
  patchUjatVolunteerSecondInterviewScreeningStatus,
  sortUjatVolunteerInterview2Applicants,
  type UjatVolunteerApplicantRow,
  type UjatVolunteerInterviewEvaluationPayload,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import type {
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL,
  type UjatVolunteerInterview2Filters,
} from './filter-fields'
import { useUjatVolunteerInterview2Columns } from './columns'
import { mapUjatVolunteerAssignedInterviewToCalendarEvents } from '../shared/assigned-interview-calendar-events'
import type { UjatInterview2ConfirmRequest } from './actions'
import {
  confirmUjatVolunteerInterview2Fail,
  confirmUjatVolunteerInterview2Pass,
  openUjatVolunteerInterview2BulkPassModal,
} from './actions'
import type { UjatInterview2BulkPassConfirmPayload } from './bulk-pass-modal'
import {
  guardUjatVolunteerInterview2Evaluation,
  guardUjatVolunteerInterview2Fail,
  guardUjatVolunteerInterview2Pass,
  guardUjatVolunteerWithdrawActivity,
} from '../applicant/guard-actions'

function matchesScoreFilter(score: number | null | undefined, filter: string): boolean {
  if (filter === UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL) return true
  if (filter === 'empty') return score == null
  if (filter === 'gte90') return score != null && score >= 90
  if (filter === 'gte80') return score != null && score >= 80
  return true
}

function filterInterview2Applicants(
  rows: UjatVolunteerApplicantRow[],
  filters: UjatVolunteerInterview2Filters
): UjatVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      filters.preferredRegion !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.preferredRegion !== filters.preferredRegion
    ) {
      return false
    }
    if (
      filters.interviewDate !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.assignedInterviewDateLabel !== filters.interviewDate
    ) {
      return false
    }
    if (
      filters.interviewTime !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.assignedInterviewTime !== filters.interviewTime
    ) {
      return false
    }
    if (!matchesScoreFilter(row.totalScore, filters.totalScore)) return false
    if (
      filters.secondInterviewScreeningStatus !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.secondInterviewScreeningStatus !== filters.secondInterviewScreeningStatus
    ) {
      return false
    }
    return true
  })
}

export type UjatVolunteerInterview2ViewMode = 'list' | 'calendar'

export function useUjatVolunteerInterview2({
  programId,
  half,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
}) {
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() =>
    getUjatVolunteerInterview2Applicants(programId, half)
  )
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerInterview2Filters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerInterview2Filters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<UjatVolunteerInterview2ViewMode>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [interview2Confirm, setInterview2Confirm] = useState<UjatInterview2ConfirmRequest | null>(
    null
  )
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [evaluationTargetId, setEvaluationTargetId] = useState<string | null>(null)
  const [bulkPassModalOpen, setBulkPassModalOpen] = useState(false)

  useEffect(() => {
    setList(getUjatVolunteerInterview2Applicants(programId, half))
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setViewMode('list')
    setSelectedRowKeys([])
    setWithdrawTargetId(null)
    setEvaluationTargetId(null)
    setBulkPassModalOpen(false)
  }, [programId, half])

  const updateRow = useCallback((id: string, patch: Partial<UjatVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    const filtered = filterInterview2Applicants(list, appliedFilters)
    return sortUjatVolunteerInterview2Applicants(filtered)
  }, [appliedFilters, list])

  const calendarEvents = useMemo(
    () => mapUjatVolunteerAssignedInterviewToCalendarEvents(filteredSorted),
    [filteredSorted]
  )

  const applySecondInterviewStatus = useCallback(
    (ids: string[], status: UjatSecondInterviewScreeningStatus) => {
      setList(prev => patchUjatVolunteerSecondInterviewScreeningStatus(prev, ids, status))
      setSelectedRowKeys([])
    },
    []
  )

  const showInterview2Confirm = useCallback((options: UjatInterview2ConfirmRequest) => {
    setInterview2Confirm(options)
  }, [])

  const closeInterview2Confirm = useCallback(() => {
    setInterview2Confirm(null)
  }, [])

  const handleBulkFail = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    confirmUjatVolunteerInterview2Fail({
      showConfirm: showInterview2Confirm,
      count: ids.length,
      onConfirm: () => applySecondInterviewStatus(ids, 'fail'),
    })
  }, [applySecondInterviewStatus, selectedRowKeys, showInterview2Confirm])

  const handleBulkPass = useCallback(() => {
    openUjatVolunteerInterview2BulkPassModal(
      () => setBulkPassModalOpen(true),
      selectedRowKeys.length
    )
  }, [selectedRowKeys.length])

  const closeBulkPassModal = useCallback(() => {
    setBulkPassModalOpen(false)
  }, [])

  const confirmBulkPass = useCallback(
    (payload: UjatInterview2BulkPassConfirmPayload) => {
      const ids = selectedRowKeys.map(String)
      applySecondInterviewStatus(ids, payload.passType)
      const passTypeLabel =
        UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS.find(option => option.value === payload.passType)
          ?.label ?? payload.passType
      const notifyLabel =
        payload.notifyTiming === 'immediate'
          ? '즉시'
          : payload.notifyTiming === 'on_announcement'
            ? '발표일에 맞춰서'
            : (payload.manualNotifyAt?.format('YYYY. MM. DD HH:mm') ?? '직접 설정')
      showAlert({
        title: '일괄 합격',
        content: `선택한 ${ids.length}건이 ${passTypeLabel} 처리되었습니다. (알림: ${notifyLabel}, 목 데이터)`,
      })
      setBulkPassModalOpen(false)
    },
    [applySecondInterviewStatus, selectedRowKeys, showAlert]
  )

  const requestInterview2Pass = useCallback(
    (row: UjatVolunteerApplicantRow) => {
      if (!guardUjatVolunteerInterview2Pass(row)) return
      confirmUjatVolunteerInterview2Pass({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'pass'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
  )

  const requestInterview2Fail = useCallback(
    (row: UjatVolunteerApplicantRow) => {
      if (!guardUjatVolunteerInterview2Fail(row)) return
      confirmUjatVolunteerInterview2Fail({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'fail'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
  )

  const requestWithdrawActivity = useCallback((row: UjatVolunteerApplicantRow) => {
    if (!guardUjatVolunteerWithdrawActivity(row)) return
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

  const openEvaluationModal = useCallback((row: UjatVolunteerApplicantRow) => {
    if (!guardUjatVolunteerInterview2Evaluation(row)) return
    setEvaluationTargetId(row.id)
  }, [])

  const closeEvaluationModal = useCallback(() => {
    setEvaluationTargetId(null)
  }, [])

  const evaluationTarget = useMemo(
    () => (evaluationTargetId ? list.find(row => row.id === evaluationTargetId) : undefined),
    [evaluationTargetId, list]
  )

  const saveInterviewEvaluation = useCallback(
    (payload: UjatVolunteerInterviewEvaluationPayload) => {
      if (!evaluationTargetId) return
      setList(prev => patchUjatVolunteerInterviewEvaluation(prev, evaluationTargetId, payload))
      showAlert({
        title: '면접 평가',
        content: '면접 평가가 저장되었습니다.',
      })
      setEvaluationTargetId(null)
    },
    [evaluationTargetId, showAlert]
  )

  const columns = useUjatVolunteerInterview2Columns()

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
    tableData: filteredSorted,
    columns,
    count: filteredSorted.length,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    bulkPassModalOpen,
    closeBulkPassModal,
    confirmBulkPass,
    bulkPassCount: selectedRowKeys.length,
    interview2Confirm,
    closeInterview2Confirm,
    filterRowsSource: list,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    requestInterview2Pass,
    requestInterview2Fail,
    openEvaluationModal,
    closeEvaluationModal,
    evaluationTarget,
    saveInterviewEvaluation,
  }
}
