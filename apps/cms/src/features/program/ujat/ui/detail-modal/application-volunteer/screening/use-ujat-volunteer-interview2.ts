import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import {
  getUjatVolunteerInterview2Applicants,
  patchUjatVolunteerSecondInterviewScreeningStatus,
  sortUjatVolunteerInterview2Applicants,
  type UjatVolunteerApplicantRow,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import type {
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL,
  type UjatVolunteerInterview2Filters,
} from './ujat-volunteer-interview2-filter-fields'
import { useUjatVolunteerInterview2Columns } from './ujat-volunteer-interview2-columns'
import { mapUjatVolunteerAssignedInterviewToCalendarEvents } from './ujat-volunteer-assigned-interview-calendar-events'
import type { UjatInterview2ConfirmRequest } from './ujat-volunteer-interview2-actions'
import {
  confirmUjatVolunteerInterview2Fail,
  confirmUjatVolunteerInterview2Pass,
} from './ujat-volunteer-interview2-actions'

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
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() =>
    getUjatVolunteerInterview2Applicants(programId, half)
  )
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerInterview2Filters>(
    () => ({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerInterview2Filters>(
    () => ({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
  )
  const [viewMode, setViewMode] = useState<UjatVolunteerInterview2ViewMode>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [interview2Confirm, setInterview2Confirm] = useState<UjatInterview2ConfirmRequest | null>(
    null
  )

  useEffect(() => {
    setList(getUjatVolunteerInterview2Applicants(programId, half))
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setViewMode('list')
    setSelectedRowKeys([])
  }, [programId, half])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    const filtered = filterInterview2Applicants(list, appliedFilters)
    return sortUjatVolunteerInterview2Applicants(filtered)
  }, [list, appliedFilters])

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
    const ids = selectedRowKeys.map(String)
    confirmUjatVolunteerInterview2Pass({
      showConfirm: showInterview2Confirm,
      count: ids.length,
      onConfirm: () => applySecondInterviewStatus(ids, 'pass'),
    })
  }, [applySecondInterviewStatus, selectedRowKeys, showInterview2Confirm])

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
    interview2Confirm,
    closeInterview2Confirm,
    filterRowsSource: list,
  }
}
