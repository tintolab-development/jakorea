import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { getUjatEducationProgressVolunteerMockRows } from '@/data/mock/ujat-education-progress-volunteers-mock'
import type { EducationProgressHalfKey } from '../ujat-education-progress-tabs'
import { UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL } from './filter-fields'
import { useUjatEducationProgressVolunteerColumns } from './columns'
import {
  buildUjatEducationProgressVolunteerRowFromMember,
  fetchUjatEducationProgressVolunteerMemberCandidates,
} from './ujat-education-progress-volunteer-members'
import {
  EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS,
  type UjatEducationProgressVolunteerFilters,
  type UjatEducationProgressVolunteerMemberCandidate,
  type UjatEducationProgressVolunteerRow,
} from './types'

function filterRows(
  rows: UjatEducationProgressVolunteerRow[],
  filters: UjatEducationProgressVolunteerFilters
): UjatEducationProgressVolunteerRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()

  return rows.filter(row => {
    if (nameQ && !row.volunteerName.toLowerCase().includes(nameQ)) return false
    if (filters.grade !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL && row.grade !== filters.grade) {
      return false
    }
    if (
      filters.regionKey !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL &&
      row.regionKey !== filters.regionKey
    ) {
      return false
    }
    if (
      filters.assignmentStatus !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL &&
      row.assignmentStatus !== filters.assignmentStatus
    ) {
      return false
    }
    return true
  })
}

export function useUjatEducationProgressVolunteers(half: EducationProgressHalfKey) {
  const [pendingFilters, setPendingFilters] = useState<UjatEducationProgressVolunteerFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationProgressVolunteerFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [allRows, setAllRows] = useState<UjatEducationProgressVolunteerRow[]>(() =>
    getUjatEducationProgressVolunteerMockRows(half)
  )
  const [memberOptions, setMemberOptions] = useState<UjatEducationProgressVolunteerMemberCandidate[]>(
    []
  )

  useEffect(() => {
    setAllRows(getUjatEducationProgressVolunteerMockRows(half))
  }, [half])

  const registeredVolunteerNames = useMemo(
    () => allRows.map(r => r.volunteerName),
    [allRows]
  )

  useEffect(() => {
    let cancelled = false
    void fetchUjatEducationProgressVolunteerMemberCandidates(registeredVolunteerNames).then(
      options => {
        if (!cancelled) setMemberOptions(options)
      }
    )
    return () => {
      cancelled = true
    }
  }, [registeredVolunteerNames])

  const tableData = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
  )

  const columns = useUjatEducationProgressVolunteerColumns()

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetHalfState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
    setSelectedRowKeys([])
    setAllRows(getUjatEducationProgressVolunteerMockRows(half))
  }, [half])

  const addVolunteerFromMember = useCallback(
    async (memberId: string) => {
      const nextNo = allRows.length > 0 ? Math.max(...allRows.map(r => r.no)) + 1 : 1
      const row = await buildUjatEducationProgressVolunteerRowFromMember(half, memberId, nextNo)
      if (!row) return
      if (allRows.some(r => r.id === row.id || r.volunteerName === row.volunteerName)) return
      setAllRows(prev => [row, ...prev])
    },
    [allRows, half]
  )

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    resetHalfState,
    memberOptions,
    addVolunteerFromMember,
  }
}
