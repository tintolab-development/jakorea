import { useCallback, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import { buildParticipatingIndividualProgressAttendanceFilterFields } from '@/features/program/general/lib/participating-individual-progress-attendance-filter-fields'
import { filterProgressAttendanceParticipantsForDisplay } from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import {
  getParticipatingIndividualProgressAttendanceEducationScheduleOptions,
  getParticipatingIndividualProgressAttendanceSessionParticipants,
  getParticipatingIndividualProgressAttendanceSessions,
  patchParticipatingIndividualProgressAttendanceParticipant,
} from '@/features/program/general/lib/participating-individual-progress-attendance-mock'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  type ParticipatingIndividualProgressAttendanceFilters,
  type ParticipatingIndividualProgressAttendanceParticipantRow,
  type ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

export const EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTERS: ParticipatingIndividualProgressAttendanceFilters =
  {
    educationSchedule: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
    participantName: '',
    affiliation: '',
    educationGrade: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
    attendanceStatus: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  }

function filterSessionGroups(
  program: Program,
  filters: ParticipatingIndividualProgressAttendanceFilters,
  dataVersion: number
) {
  void dataVersion
  const sessions = getParticipatingIndividualProgressAttendanceSessions(program)
  const filteredBySchedule =
    filters.educationSchedule === PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  return filteredBySchedule
    .map(session => ({
      ...session,
      participants: filterProgressAttendanceParticipantsForDisplay(session.participants, filters),
    }))
    .filter(session => session.participants.length > 0)
}

export function useParticipatingIndividualProgressAttendance(program: Program) {
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] =
    useState<ParticipatingIndividualProgressAttendanceFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTERS,
    }))
  const [appliedFilters, setAppliedFilters] =
    useState<ParticipatingIndividualProgressAttendanceFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTERS,
    }))

  const educationScheduleOptions = useMemo(() => {
    void dataVersion
    return getParticipatingIndividualProgressAttendanceEducationScheduleOptions(program)
  }, [dataVersion, program])

  const filterFields = useMemo(
    () => buildParticipatingIndividualProgressAttendanceFilterFields(educationScheduleOptions),
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

  const saveSessionParticipant = useCallback(
    (
      sessionId: string,
      participantRowId: string,
      patch: {
        attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
        lateTime?: string
        remark?: string
      }
    ) => {
      patchParticipatingIndividualProgressAttendanceParticipant(
        String(program.id),
        sessionId,
        participantRowId,
        patch
      )
      setDataVersion(version => version + 1)
    },
    [program.id]
  )

  const getSessionParticipants = useCallback(
    (sessionId: string): ParticipatingIndividualProgressAttendanceParticipantRow[] => {
      void dataVersion
      return getParticipatingIndividualProgressAttendanceSessionParticipants(program, sessionId)
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
    saveSessionParticipant,
    getSessionParticipants,
  }
}
