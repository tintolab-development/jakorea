import { useCallback, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import { buildParticipatingIndividualProgressAssignmentFilterFields } from '@/features/program/general/lib/participating-individual-progress-assignment-filter-fields'
import { filterProgressAssignmentParticipantsForDisplay } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import {
  getParticipatingIndividualProgressAssignmentEducationScheduleOptions,
  getParticipatingIndividualProgressAssignmentSessionParticipants,
  getParticipatingIndividualProgressAssignmentSessions,
} from '@/features/program/general/lib/participating-individual-progress-assignment-mock'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  type ParticipatingIndividualProgressAssignmentFilters,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

export const EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTERS: ParticipatingIndividualProgressAssignmentFilters =
  {
    educationSchedule: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
    participantName: '',
    affiliation: '',
    educationGrade: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
    submissionStatus: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  }

function filterSessionGroups(
  program: Program,
  filters: ParticipatingIndividualProgressAssignmentFilters,
  dataVersion: number
) {
  void dataVersion
  const sessions = getParticipatingIndividualProgressAssignmentSessions(program)
  const filteredBySchedule =
    filters.educationSchedule === PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  return filteredBySchedule
    .map(session => ({
      ...session,
      participants: filterProgressAssignmentParticipantsForDisplay(session.participants, filters),
    }))
    .filter(session => session.participants.length > 0)
}

export function useParticipatingIndividualProgressAssignment(program: Program) {
  const [dataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] =
    useState<ParticipatingIndividualProgressAssignmentFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTERS,
    }))
  const [appliedFilters, setAppliedFilters] =
    useState<ParticipatingIndividualProgressAssignmentFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTERS,
    }))

  const educationScheduleOptions = useMemo(() => {
    void dataVersion
    return getParticipatingIndividualProgressAssignmentEducationScheduleOptions(program)
  }, [dataVersion, program])

  const filterFields = useMemo(
    () => buildParticipatingIndividualProgressAssignmentFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const sessionGroups = useMemo(
    () => filterSessionGroups(program, appliedFilters, dataVersion),
    [appliedFilters, dataVersion, program]
  )

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const getSessionParticipants = useCallback(
    (sessionId: string) => {
      void dataVersion
      return getParticipatingIndividualProgressAssignmentSessionParticipants(program, sessionId)
    },
    [dataVersion, program]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    getSessionParticipants,
  }
}
