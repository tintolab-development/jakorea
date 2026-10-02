import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
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

export function filterAssignmentVolunteersForDisplay(
  volunteers: UjatAssignmentVolunteerRow[],
  filters: UjatAssignmentFilters
): UjatAssignmentVolunteerRow[] {
  const visible = filterVisibleAssignmentVolunteers(volunteers)
  const hasRowFilter =
    filters.volunteerName.trim() !== '' ||
    filters.institutionName !== UJAT_ASSIGNMENT_FILTER_ALL ||
    filters.submissionStatus !== UJAT_ASSIGNMENT_FILTER_ALL
  if (!hasRowFilter) return visible
  return visible.filter(row => volunteerMatchesFilters(row, filters))
}

function filterSessionGroups(
  sessions: UjatAssignmentSessionGroup[],
  filters: UjatAssignmentFilters
): UjatAssignmentSessionGroup[] {
  return sessions
    .filter(session => {
      if (
        filters.educationDate !== UJAT_ASSIGNMENT_FILTER_ALL &&
        session.isoDate !== filters.educationDate
      ) {
        return false
      }
      const visibleVolunteers = filterVisibleAssignmentVolunteers(session.volunteers)
      const filtered = filterAssignmentVolunteersForDisplay(visibleVolunteers, filters)
      return filtered.length > 0
    })
    .map(session => ({
      ...session,
      volunteers: filterVisibleAssignmentVolunteers(session.volunteers),
    }))
}

const EMPTY_SESSIONS: UjatAssignmentSessionGroup[] = []

export function useUjatEducationProgressAssignments(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
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

  const assignmentsQuery = useQuery({
    queryKey: ujatQueryKeys.assignmentSubmissions(programId, educationRegionCode, semesterType),
    enabled: remoteEnabled,
    queryFn: async () =>
      buildUjatAssignmentSessionsFromResponse({
        response: await fetchUjatAssignmentSubmissions(programId, {
          semesterType,
          educationRegionCode,
        }),
        regionKey,
        half,
      }),
  })

  useEffect(() => {
    if (!assignmentsQuery.isError || assignmentsQuery.isFetching) return
    showAlert({
      title: '목록 조회 실패',
      content: '과제 제출 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [assignmentsQuery.isError, assignmentsQuery.isFetching, showAlert])

  const remoteSessions = assignmentsQuery.data ?? EMPTY_SESSIONS

  const educationDateOptions = useMemo(
    () =>
      remoteSessions.map(session => ({ label: session.dateLabel, value: session.isoDate })),
    [remoteSessions]
  )

  const institutionOptions = useMemo(() => {
    const names = new Set<string>()
    for (const session of remoteSessions) {
      for (const row of filterVisibleAssignmentVolunteers(session.volunteers)) {
        if (row.institutionName && row.institutionName !== '-') names.add(row.institutionName)
      }
    }
    return [...names].sort().map(name => ({ label: name, value: name }))
  }, [remoteSessions])

  const filterFields = useMemo(
    () => buildUjatAssignmentFilterFields(educationDateOptions, institutionOptions),
    [educationDateOptions, institutionOptions]
  )

  const sessionGroups = useMemo(
    () => filterSessionGroups(remoteSessions, appliedFilters),
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
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    resetRegionState,
    loading: remoteEnabled && assignmentsQuery.isFetching && remoteSessions.length === 0,
  }
}
