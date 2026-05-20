import { useCallback, useMemo, useState } from 'react'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { buildUjatScheduleConfirmRows } from './build-confirm-rows'
import { UJAT_SCHEDULE_CONFIRM_FILTER_ALL } from './filter-fields'
import { useUjatScheduleConfirmColumns } from './columns'
import {
  EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS,
  type UjatScheduleConfirmFilters,
  type UjatScheduleConfirmRow,
} from './types'

function filterRows(
  rows: UjatScheduleConfirmRow[],
  filters: UjatScheduleConfirmFilters
): UjatScheduleConfirmRow[] {
  const institutionQ = filters.institutionName.trim().toLowerCase()
  const teacherQ = filters.teacherName.trim().toLowerCase()

  return rows.filter(row => {
    if (institutionQ && !row.institutionName.toLowerCase().includes(institutionQ)) return false
    if (
      filters.scheduleConfirmStatus !== UJAT_SCHEDULE_CONFIRM_FILTER_ALL &&
      row.scheduleConfirmStatus !== filters.scheduleConfirmStatus
    ) {
      return false
    }
    if (
      filters.confirmedScheduleIso !== UJAT_SCHEDULE_CONFIRM_FILTER_ALL &&
      !row.confirmedScheduleIsoDates.includes(filters.confirmedScheduleIso)
    ) {
      return false
    }
    if (teacherQ && !row.teacherName.toLowerCase().includes(teacherQ)) return false
    return true
  })
}

export function useUjatScheduleConfirmList(regionKey: UjatInstitutionApplicationRegionKey) {
  const [pendingFilters, setPendingFilters] = useState<UjatScheduleConfirmFilters>(
    () => ({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatScheduleConfirmFilters>(
    () => ({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
  )
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const allRows = useMemo(() => buildUjatScheduleConfirmRows(regionKey), [regionKey])

  const tableData = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
  )

  const columns = useUjatScheduleConfirmColumns()

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
    setViewMode('table')
  }, [])

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    viewMode,
    setViewMode,
    resetRegionState,
  }
}
