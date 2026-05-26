import { useCallback, useMemo, useState } from 'react'
import { getUjatEducationProgressInstitutions } from '@/data/mock/ujat-education-progress-institutions-mock'
import type { EducationProgressHalfKey } from '../tabs'
import { UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL } from './filter-fields'
import { buildUjatEducationProgressInstitutionColumns } from './columns'
import {
  EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS,
  type UjatEducationProgressInstitutionFilters,
  type UjatEducationProgressInstitutionRow,
} from './types'

function filterRows(
  rows: UjatEducationProgressInstitutionRow[],
  filters: UjatEducationProgressInstitutionFilters
): UjatEducationProgressInstitutionRow[] {
  const institutionQ = filters.institutionName.trim().toLowerCase()
  const teacherQ = filters.teacherName.trim().toLowerCase()

  return rows.filter(row => {
    if (institutionQ && !row.institutionName.toLowerCase().includes(institutionQ)) return false
    if (
      filters.educationRegion !== UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL &&
      row.regionKey !== filters.educationRegion
    ) {
      return false
    }
    if (
      filters.educationScheduleIso !== UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL &&
      !row.educationScheduleIsoDates.includes(filters.educationScheduleIso)
    ) {
      return false
    }
    if (teacherQ && !row.teacherName.toLowerCase().includes(teacherQ)) return false
    return true
  })
}

export function useUjatEducationProgressInstitutions(
  programId: string,
  half: EducationProgressHalfKey
) {
  const [pendingFilters, setPendingFilters] = useState<UjatEducationProgressInstitutionFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationProgressInstitutionFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
  )
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const allRows = useMemo(
    () => getUjatEducationProgressInstitutions(programId, half),
    [programId, half]
  )

  const tableData = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
  )

  const columns = useMemo(() => buildUjatEducationProgressInstitutionColumns(), [])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetHalfState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
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
    resetHalfState,
  }
}
