import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { fetchUjatAssignmentSubmissions } from '@/features/program/ujat/api/education-execution-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import {
  filterVisibleAssignmentVolunteers,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import { buildUjatAssignmentSessionsFromResponse } from './assignment-submissions-adapter'
import { buildUjatAssignmentFilterFields } from './filter-fields'
import {
  EMPTY_UJAT_ASSIGNMENT_FILTERS,
  UJAT_ASSIGNMENT_FILTER_ALL,
  type UjatAssignmentFilters,
  type UjatAssignmentSessionGroup,
  type UjatAssignmentVolunteerRow,
} from './types'

function hasVolunteerRowFilter(filters: UjatAssignmentFilters): boolean {
  return (
    filters.volunteerName.trim() !== '' ||
    filters.institutionName !== UJAT_ASSIGNMENT_FILTER_ALL ||
    filters.submissionStatus !== UJAT_ASSIGNMENT_FILTER_ALL
  )
}

function volunteerMatchesFilters(
  row: UjatAssignmentVolunteerRow,
  filters: UjatAssignmentFilters
): boolean {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  if (
    filters.institutionName !== UJAT_ASSIGNMENT_FILTER_ALL &&
    row.institutionName !== filters.institutionName
  ) {
    return false
  }
  if (
    filters.submissionStatus !== UJAT_ASSIGNMENT_FILTER_ALL &&
    resolveAssignmentSubmissionStatus(row) !== filters.submissionStatus
  ) {
    return false
  }
  return true
}

/** 활동 포기자 노출 규칙 적용 후 봉사자명·배정 기관·제출 현황 필터 */
export function filterAssignmentVolunteersForDisplay(
  volunteers: UjatAssignmentVolunteerRow[],
  filters: UjatAssignmentFilters
): UjatAssignmentVolunteerRow[] {
  const visible = filterVisibleAssignmentVolunteers(volunteers)
  if (!hasVolunteerRowFilter(filters)) return visible
  return visible.filter(row => volunteerMatchesFilters(row, filters))
}

/** 교육 진행일 필터 + 행 필터 적용. 반환 세션의 `volunteers`는 화면에 그릴 행만 담는다. */
export function filterAssignmentSessionGroups(
  sessions: UjatAssignmentSessionGroup[],
  filters: UjatAssignmentFilters
): UjatAssignmentSessionGroup[] {
  return sessions.flatMap(session => {
    if (
      filters.educationDate !== UJAT_ASSIGNMENT_FILTER_ALL &&
      session.isoDate !== filters.educationDate
    ) {
      return []
    }
    const volunteers = filterAssignmentVolunteersForDisplay(session.volunteers, filters)
    if (volunteers.length === 0) return []
    return [{ ...session, volunteers }]
  })
}

function collectInstitutionOptions(
  sessions: UjatAssignmentSessionGroup[]
): Array<{ value: string; label: string }> {
  const names = new Set<string>()
  for (const session of sessions) {
    for (const volunteer of filterVisibleAssignmentVolunteers(session.volunteers)) {
      const name = volunteer.institutionName.trim()
      if (name && name !== '-') names.add(name)
    }
  }
  return [...names]
    .sort((a, b) => a.localeCompare(b, 'ko'))
    .map(name => ({ value: name, label: name }))
}

export function useUjatEducationProgressAssignments(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
  const hasEducationRegionCode = Boolean(educationRegionCode)
  const semesterType = toUjatRecruitHalfApi(half)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-assignments',
    'UJAT 진행 현황 · 과제'
  )

  const [pendingFilters, setPendingFilters] = useState<UjatAssignmentFilters>(
    () => ({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatAssignmentFilters>(
    () => ({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
  )

  // 운영 데이터(제출·피드백 상태) — 짧은 staleTime, 피드백 등록 시 assignmentSubmissionsAll 무효화
  const remoteQuery = useQuery({
    queryKey: ujatQueryKeys.assignmentSubmissions(programId, educationRegionCode, semesterType),
    enabled: remoteEnabled && hasEducationRegionCode,
    staleTime: 15_000,
    retry: false,
    queryFn: ({ signal }) =>
      fetchUjatAssignmentSubmissions(
        programId,
        { semesterType, educationRegionCode },
        { signal }
      ),
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null || remoteQuery.isError) return []
    return buildUjatAssignmentSessionsFromResponse({
      response: remoteQuery.data,
      half,
      regionKey,
    })
  }, [half, regionKey, remoteEnabled, remoteQuery.data, remoteQuery.isError])

  const educationDateOptions = useMemo(() => {
    const seen = new Set<string>()
    return remoteSessions.reduce<{ value: string; label: string }[]>((acc, session) => {
      if (!session.isoDate || seen.has(session.isoDate)) return acc
      seen.add(session.isoDate)
      acc.push({ value: session.isoDate, label: session.dateLabel })
      return acc
    }, [])
  }, [remoteSessions])

  const institutionOptions = useMemo(
    () => collectInstitutionOptions(remoteSessions),
    [remoteSessions]
  )

  const filterFields = useMemo(
    () => buildUjatAssignmentFilterFields(educationDateOptions, institutionOptions),
    [educationDateOptions, institutionOptions]
  )

  const sessionGroups = useMemo(
    () => filterAssignmentSessionGroups(remoteSessions, appliedFilters),
    [appliedFilters, remoteSessions]
  )

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
  }, [])

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    hasActiveFilters: hasVolunteerRowFilter(appliedFilters) ||
      appliedFilters.educationDate !== UJAT_ASSIGNMENT_FILTER_ALL,
    resetRegionState,
    isLoading: remoteEnabled && (!hasEducationRegionCode || remoteQuery.isLoading),
    isError: remoteEnabled && hasEducationRegionCode && remoteQuery.isError,
    isRemote: remoteEnabled,
  }
}
