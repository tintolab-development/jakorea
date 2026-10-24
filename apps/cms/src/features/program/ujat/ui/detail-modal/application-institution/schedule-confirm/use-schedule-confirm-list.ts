import { useCallback, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { buildUjatScheduleConfirmRows } from './build-confirm-rows'
import { buildUjatScheduleConfirmFilterFields, UJAT_SCHEDULE_CONFIRM_FILTER_ALL } from './filter-fields'
import { useUjatScheduleConfirmColumns } from './columns'
import {
  EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS,
  type UjatScheduleConfirmFilters,
  type UjatScheduleConfirmRow,
} from './types'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import type { UjatApplicationsListQuery } from '@/features/program/ujat/api/ujat-applications-contract'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'

function filterRows(
  rows: UjatScheduleConfirmRow[],
  filters: UjatScheduleConfirmFilters
): UjatScheduleConfirmRow[] {
  return rows.filter(row => {
    if (
      filters.scheduleConfirmStatus !== UJAT_SCHEDULE_CONFIRM_FILTER_ALL &&
      row.scheduleConfirmStatus !== filters.scheduleConfirmStatus
    ) {
      return false
    }
    if (filters.confirmedScheduleIsoDates.length > 0) {
      const selected = new Set(filters.confirmedScheduleIsoDates)
      const matches = row.confirmedScheduleIsoDates.some(iso => selected.has(iso))
      if (!matches) return false
    }
    return true
  })
}

export function useUjatScheduleConfirmList(
  regionKey: UjatInstitutionApplicationRegionKey,
  programId?: string | null
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const [pendingFilters, setPendingFilters] = useState<UjatScheduleConfirmFilters>(
    () => ({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatScheduleConfirmFilters>(
    () => ({ ...EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS })
  )
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const listQuery = useMemo((): UjatApplicationsListQuery => {
    const organizationName = appliedFilters.institutionName.trim()
    const teacherName = appliedFilters.teacherName.trim()
    return {
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      educationRegionCode: toUjatEducationRegionCode(regionKey),
      ...(organizationName ? { organizationName } : {}),
      ...(teacherName ? { teacherName } : {}),
    }
  }, [appliedFilters.institutionName, appliedFilters.teacherName, regionKey])

  const remoteQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', listQuery),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, listQuery),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const sourceRows = useMemo(
    () => remoteQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [remoteQuery.data]
  )

  const allRows = useMemo(
    () => buildUjatScheduleConfirmRows(regionKey, sourceRows),
    [regionKey, sourceRows]
  )

  const tableData = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
  )

  const columns = useUjatScheduleConfirmColumns()

  const filterFields = useMemo(
    () => buildUjatScheduleConfirmFilterFields(regionKey),
    [regionKey]
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key === 'confirmedScheduleIsoDates') {
      setPendingFilters(prev => ({
        ...prev,
        confirmedScheduleIsoDates: Array.isArray(value) ? value.map(String) : [],
      }))
      return
    }
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
    filterFields,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    viewMode,
    setViewMode,
    resetRegionState,
  }
}
