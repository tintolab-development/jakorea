import { useCallback, useMemo, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui'
import {
  getUjatInstitutionApplicationMockRows,
  patchUjatInstitutionApplicationRows,
  UJAT_INSTITUTION_MAX_CLASSES_PER_DAY,
} from '@/data/mock/ujat-institution-application-mock'
import { UJAT_INSTITUTION_APPLICATION_FILTER_ALL } from './ujat-institution-application-filter-fields'
import {
  type UjatInstitutionApplicationFilters,
  EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  type UjatInstitutionApplicationRow,
  type UjatInstitutionTempAssignmentStatus,
} from './ujat-institution-application-types'
import type { UjatInstitutionApplicationRegionKey } from './ujat-institution-application-regions'
import { useUjatInstitutionApplicationColumns } from './ujat-institution-application-columns'

function filterRows(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRegionKey,
  filters: UjatInstitutionApplicationFilters
): UjatInstitutionApplicationRow[] {
  const institutionQ = filters.institutionName.trim().toLowerCase()
  const teacherQ = filters.teacherName.trim().toLowerCase()
  const totalQ = filters.totalClassCount.trim()

  return rows.filter(row => {
    if (row.regionKey !== regionKey) return false
    if (institutionQ && !row.institutionName.toLowerCase().includes(institutionQ)) return false
    if (
      filters.tempAssignmentStatus !== UJAT_INSTITUTION_APPLICATION_FILTER_ALL &&
      row.tempAssignmentStatus !== filters.tempAssignmentStatus
    ) {
      return false
    }
    if (totalQ) {
      const parsed = Number(totalQ)
      if (!Number.isNaN(parsed) && row.totalClassCount !== parsed) return false
      if (Number.isNaN(parsed) && !String(row.totalClassCount).includes(totalQ)) return false
    }
    if (teacherQ && !row.teacherName.toLowerCase().includes(teacherQ)) return false
    return true
  })
}

export function useUjatInstitutionApplicationList(regionKey: UjatInstitutionApplicationRegionKey) {
  const { showAlert } = useCmsAlert()
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] = useState<UjatInstitutionApplicationFilters>(
    () => ({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatInstitutionApplicationFilters>(
    () => ({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const allRows = useMemo(() => {
    void dataVersion
    return getUjatInstitutionApplicationMockRows()
  }, [dataVersion])

  const tableData = useMemo(
    () => filterRows(allRows, regionKey, appliedFilters),
    [allRows, regionKey, appliedFilters]
  )

  const columns = useUjatInstitutionApplicationColumns()

  const maxClassesPerDay = UJAT_INSTITUTION_MAX_CLASSES_PER_DAY[regionKey]

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    const raw = String(value ?? '')
    const next = key === 'totalClassCount' ? raw.replace(/\D/g, '') : raw
    setPendingFilters(prev => ({ ...prev, [key]: next }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
    setSelectedRowKeys([])
  }, [pendingFilters])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const patchSelectedStatus = useCallback(
    (status: UjatInstitutionTempAssignmentStatus) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) {
        showNoSelectionAlert()
        return
      }
      patchUjatInstitutionApplicationRows(ids, status)
      setDataVersion(v => v + 1)
      setSelectedRowKeys([])
    },
    [selectedRowKeys, showNoSelectionAlert]
  )

  const handleBulkApplicationReject = useCallback(() => {
    patchSelectedStatus('application_rejected')
  }, [patchSelectedStatus])

  const handleBulkTempReject = useCallback(() => {
    patchSelectedStatus('temp_rejected')
  }, [patchSelectedStatus])

  const handleBulkTempAssign = useCallback(() => {
    patchSelectedStatus('temp_assigned')
  }, [patchSelectedStatus])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setSelectedRowKeys([])
    setViewMode('table')
  }, [])

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1)
  }, [])

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    viewMode,
    setViewMode,
    maxClassesPerDay,
    handleBulkApplicationReject,
    handleBulkTempReject,
    handleBulkTempAssign,
    resetRegionState,
    refreshData,
  }
}
