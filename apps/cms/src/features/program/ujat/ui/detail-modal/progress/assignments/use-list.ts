import { useCallback, useMemo, useState } from 'react'
import {
  getUjatEducationProgressAssignmentDateOptions,
  getUjatEducationProgressAssignmentInstitutionOptions,
  getUjatEducationProgressAssignmentSessions,
} from '@/data/mock/ujat-education-progress-assignments-mock'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import {
  filterVisibleAssignmentVolunteers,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
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
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const [pendingFilters, setPendingFilters] = useState<UjatAssignmentFilters>(
    () => ({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatAssignmentFilters>(
    () => ({ ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
  )

  const educationDateOptions = useMemo(
    () => getUjatEducationProgressAssignmentDateOptions(half),
    [half]
  )

  const institutionOptions = useMemo(
    () => getUjatEducationProgressAssignmentInstitutionOptions(half, regionKey),
    [half, regionKey]
  )

  const filterFields = useMemo(
    () => buildUjatAssignmentFilterFields(educationDateOptions, institutionOptions),
    [educationDateOptions, institutionOptions]
  )

  const sessionGroups = useMemo(() => {
    const sessions = getUjatEducationProgressAssignmentSessions(half, regionKey)
    return filterSessionGroups(sessions, appliedFilters)
  }, [appliedFilters, half, regionKey])

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
  }
}
