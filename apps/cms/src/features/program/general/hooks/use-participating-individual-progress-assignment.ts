import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { fetchGeneralProgressAssignmentBundle } from '@/features/program/general/api/admin-program-progress-service'
import { buildProgressAssignmentSessionsFromRemote } from '@/features/program/general/api/adapters/progress-assignment-adapters'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import {
  getParticipatingIndividualProgressAssignmentEducationScheduleOptions,
  getParticipatingIndividualProgressAssignmentSessionParticipants,
  getParticipatingIndividualProgressAssignmentSessions,
} from '@/features/program/general/lib/participating-individual-progress-assignment-local'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { buildParticipatingIndividualProgressAssignmentFilterFields } from '@/features/program/general/lib/participating-individual-progress-assignment-filter-fields'
import { filterProgressAssignmentParticipantsForDisplay } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  type ParticipatingIndividualProgressAssignmentFilters,
  type ParticipatingIndividualProgressAssignmentParticipantRow,
  type ParticipatingIndividualProgressAssignmentSessionGroup,
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
  sessions: ParticipatingIndividualProgressAssignmentSessionGroup[],
  filters: ParticipatingIndividualProgressAssignmentFilters
) {
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
  const isTempMockProgram = isGeneralProgramTempMockProgramId(program.id)
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && !isTempMockProgram,
    'general-progress-assignment',
    '프로그램 진행 현황 · 과제'
  )

  const [pendingFilters, setPendingFilters] =
    useState<ParticipatingIndividualProgressAssignmentFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTERS,
    }))
  const [appliedFilters, setAppliedFilters] =
    useState<ParticipatingIndividualProgressAssignmentFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTERS,
    }))

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.assignmentSubmissions(String(program.id)),
    queryFn: () => fetchGeneralProgressAssignmentBundle(String(program.id)),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return null
    return buildProgressAssignmentSessionsFromRemote(remoteQuery.data)
  }, [remoteEnabled, remoteQuery.data])

  const isRemoteDataSource = remoteEnabled && remoteSessions != null && !remoteQuery.isError

  const localSessions = useMemo(
    () => getParticipatingIndividualProgressAssignmentSessions(program),
    [program]
  )

  const educationScheduleOptions = useMemo(() => {
    if (isRemoteDataSource && remoteSessions) {
      return remoteSessions.map(session => ({
        value: session.filterValue,
        label: session.filterLabel,
      }))
    }
    if (isTempMockProgram) {
      return getParticipatingIndividualProgressAssignmentEducationScheduleOptions(program)
    }
    return []
  }, [isRemoteDataSource, isTempMockProgram, program, remoteSessions])

  const filterFields = useMemo(
    () => buildParticipatingIndividualProgressAssignmentFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const mockSessionGroups = useMemo(() => {
    const base = isTempMockProgram ? localSessions : []
    return filterSessionGroups(base, appliedFilters)
  }, [appliedFilters, isTempMockProgram, localSessions])

  const sessionGroups = useMemo(() => {
    if (isRemoteDataSource && remoteSessions) {
      return filterSessionGroups(remoteSessions, appliedFilters)
    }
    return mockSessionGroups
  }, [appliedFilters, isRemoteDataSource, mockSessionGroups, remoteSessions])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const getSessionParticipants = useCallback(
    (sessionId: string): ParticipatingIndividualProgressAssignmentParticipantRow[] => {
      if (isTempMockProgram) {
        return (
          localSessions.find(s => s.id === sessionId)?.participants ??
          getParticipatingIndividualProgressAssignmentSessionParticipants(program, sessionId)
        )
      }
      return remoteSessions?.find(s => s.id === sessionId)?.participants ?? []
    },
    [isTempMockProgram, localSessions, program, remoteSessions]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    getSessionParticipants,
    loading:
      !isTempMockProgram && remoteEnabled && remoteQuery.isFetching && remoteSessions == null,
    isRemoteDataSource: isRemoteDataSource && !isTempMockProgram,
  }
}
