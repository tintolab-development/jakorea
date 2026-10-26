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

  const remoteQuery = useQuery({
    queryKey: ujatQueryKeys.assignmentSubmissions(programId, educationRegionCode, semesterType),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
    queryFn: () =>
      fetchUjatAssignmentSubmissions(programId, {
        semesterType,
        educationRegionCode,
      }),
  })

  useEffect(() => {
    if (!remoteQuery.isError || remoteQuery.isFetching) return
    showAlert({
      title: '목록 조회 실패',
      content: '과제 제출 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [remoteQuery.isError, remoteQuery.isFetching, showAlert])

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

  const institutionOptions = useMemo(() => {
    const seen = new Set<string>()
    return remoteSessions.flatMap(session => session.volunteers).reduce<{ value: string; label: string }[]>(
      (acc, volunteer) => {
        const name = volunteer.institutionName.trim()
        if (!name || name === '-' || seen.has(name)) return acc
        seen.add(name)
        acc.push({ value: name, label: name })
        return acc
      },
      []
    )
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
    loading: remoteEnabled && remoteQuery.isFetching && remoteQuery.data == null,
  }
}
