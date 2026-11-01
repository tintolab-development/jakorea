import { useCallback, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { EducationProgressHalfKey } from '../tabs'
import { UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL } from './filter-fields'
import { buildUjatEducationProgressInstitutionColumns } from './columns'
import {
  EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS,
  UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS,
  type UjatEducationProgressInstitutionFilters,
  type UjatEducationProgressInstitutionRow,
} from './types'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import type { UjatApplicationsListQuery } from '@/features/program/ujat/api/ujat-applications-contract'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { formatScheduleColumnTitle } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

function mapOrgRowToProgressInstitution(
  row: UjatInstitutionApplicationRow,
  index: number,
  half: EducationProgressHalfKey
): UjatEducationProgressInstitutionRow {
  const gradeClassCounts = Object.fromEntries(
    UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS.map(label => [label, 0])
  ) as UjatEducationProgressInstitutionRow['gradeClassCounts']

  for (const grade of row.gradeClassCounts) {
    const key = grade.gradeLabel as (typeof UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS)[number]
    if (key in gradeClassCounts) {
      gradeClassCounts[key] = grade.classCount ?? 0
    }
  }

  const educationScheduleIsoDates = [...row.sessionIsoDates].sort()

  return {
    id: row.id,
    sourceInstitutionId: row.id,
    regionKey: row.regionKey,
    no: index + 1,
    institutionName: row.institutionName,
    educationRegion: row.regionKey
      ? getUjatEducationRegionLabel(row.regionKey, row.regionKey)
      : '-',
    educationScheduleDisplay: educationScheduleIsoDates.length
      ? educationScheduleIsoDates.map(formatScheduleColumnTitle).join(', ')
      : '-',
    educationScheduleIsoDates,
    gradeClassCounts,
    totalEducationClassCount: row.totalClassCount ?? 0,
    teacherName: row.teacherName,
    half,
  }
}

export function useUjatEducationProgressInstitutions(
  programId: string,
  half: EducationProgressHalfKey
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-institutions',
    'UJAT 진행 현황 · 참여 기관'
  )

  const [pendingFilters, setPendingFilters] = useState<UjatEducationProgressInstitutionFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationProgressInstitutionFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS })
  )
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const listQuery = useMemo((): UjatApplicationsListQuery => {
    const organizationName = appliedFilters.institutionName.trim()
    const teacherName = appliedFilters.teacherName.trim()
    const educationRegionCode =
      appliedFilters.educationRegion !== UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL
        ? appliedFilters.educationRegion
        : ''
    const selectedScheduleDates = appliedFilters.educationScheduleIsoDates
    const scheduleDate = selectedScheduleDates.length === 1 ? selectedScheduleDates[0] : ''
    return {
      status: 'APPROVED',
      recruitHalf: toUjatRecruitHalfApi(half),
      ...(organizationName ? { organizationName } : {}),
      ...(teacherName ? { teacherName } : {}),
      ...(educationRegionCode ? { educationRegionCode } : {}),
      ...(scheduleDate ? { scheduleDate } : {}),
    }
  }, [appliedFilters, half])

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      ...ujatQueryKeys.organizationApplications(programId, listQuery),
      'edu-progress',
      half,
    ] as const,
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(programId, pageParam, listQuery),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const allRows = useMemo<UjatEducationProgressInstitutionRow[]>(() => {
    const source = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
    return source.map((row, index) => mapOrgRowToProgressInstitution(row, index, half))
  }, [half, remoteQuery.data])

  const tableData = useMemo(() => {
    const selected = appliedFilters.educationScheduleIsoDates
    if (selected.length <= 1) return allRows
    const selectedSet = new Set(selected)
    return allRows.filter(row => row.educationScheduleIsoDates.some(iso => selectedSet.has(iso)))
  }, [allRows, appliedFilters.educationScheduleIsoDates])

  const columns = useMemo(() => buildUjatEducationProgressInstitutionColumns(), [])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key === 'educationScheduleIsoDates') {
      setPendingFilters(prev => ({
        ...prev,
        educationScheduleIsoDates: Array.isArray(value) ? value.map(String) : [],
      }))
      return
    }
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
