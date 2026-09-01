import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { handleError } from '@/shared/utils/error-handler'
import {
  fetchGeneralProgressAttendanceBundle,
  saveGeneralScheduleAttendances,
} from '@/features/program/general/api/admin-program-progress-service'
import {
  buildAttendanceItemRequest,
  buildProgressAttendanceSessionsFromRemote,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
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
  type ParticipatingIndividualProgressAttendanceSessionGroup,
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
  sessions: ParticipatingIndividualProgressAttendanceSessionGroup[],
  filters: ParticipatingIndividualProgressAttendanceFilters
) {
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
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)
  const queryClient = useQueryClient()
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] =
    useState<ParticipatingIndividualProgressAttendanceFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTERS,
    }))
  const [appliedFilters, setAppliedFilters] =
    useState<ParticipatingIndividualProgressAttendanceFilters>(() => ({
      ...EMPTY_PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTERS,
    }))

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.schedules(String(program.id)),
    queryFn: () => fetchGeneralProgressAttendanceBundle(String(program.id)),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return null
    return buildProgressAttendanceSessionsFromRemote(remoteQuery.data)
  }, [remoteEnabled, remoteQuery.data])

  const isRemoteDataSource = remoteEnabled && remoteSessions != null && !remoteQuery.isError

  const educationScheduleOptions = useMemo(() => {
    if (isRemoteDataSource && remoteSessions) {
      return remoteSessions.map(session => ({
        value: session.filterValue,
        label: session.filterLabel,
      }))
    }
    void dataVersion
    return getParticipatingIndividualProgressAttendanceEducationScheduleOptions(program)
  }, [dataVersion, isRemoteDataSource, program, remoteSessions])

  const filterFields = useMemo(
    () => buildParticipatingIndividualProgressAttendanceFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const mockSessionGroups = useMemo(() => {
    void dataVersion
    const sessions = getParticipatingIndividualProgressAttendanceSessions(program)
    return filterSessionGroups(sessions, appliedFilters)
  }, [appliedFilters, dataVersion, program])

  const sessionGroups = useMemo(() => {
    if (isRemoteDataSource && remoteSessions) {
      return filterSessionGroups(remoteSessions, appliedFilters)
    }
    return mockSessionGroups
  }, [appliedFilters, isRemoteDataSource, mockSessionGroups, remoteSessions])

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      sessionId: string
      participantRowId: string
      patch: {
        attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
        lateTime?: string
        remark?: string
      }
    }) => {
      const session =
        remoteSessions?.find(s => s.id === payload.sessionId) ??
        getParticipatingIndividualProgressAttendanceSessions(program).find(
          s => s.id === payload.sessionId
        )
      const participant =
        session?.participants.find(p => p.id === payload.participantRowId) ??
        getParticipatingIndividualProgressAttendanceSessionParticipants(
          program,
          payload.sessionId
        ).find(p => p.id === payload.participantRowId)

      if (!isRemoteDataSource || !participant) {
        patchParticipatingIndividualProgressAttendanceParticipant(
          String(program.id),
          payload.sessionId,
          payload.participantRowId,
          payload.patch
        )
        return
      }

      const requests = (session?.participants ?? []).map(row => {
        const patch =
          row.id === payload.participantRowId
            ? payload.patch
            : {
                attendanceStatus: row.attendanceStatus,
                lateTime: row.lateTime,
                remark: row.remark,
              }
        return buildAttendanceItemRequest({
          participantId: row.participantId,
          ...patch,
        })
      })
      await saveGeneralScheduleAttendances(payload.sessionId, requests)
    },
    onSuccess: async () => {
      if (isRemoteDataSource) {
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.schedules(String(program.id)),
        })
      } else {
        setDataVersion(version => version + 1)
      }
    },
    onError: error => {
      handleError(error, { context: 'saveGeneralScheduleAttendances' })
    },
  })

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
      void saveMutation.mutateAsync({ sessionId, participantRowId, patch })
    },
    [saveMutation]
  )

  const getSessionParticipants = useCallback(
    (sessionId: string): ParticipatingIndividualProgressAttendanceParticipantRow[] => {
      if (isRemoteDataSource && remoteSessions) {
        return remoteSessions.find(s => s.id === sessionId)?.participants ?? []
      }
      void dataVersion
      return getParticipatingIndividualProgressAttendanceSessionParticipants(program, sessionId)
    },
    [dataVersion, isRemoteDataSource, program, remoteSessions]
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
    loading: remoteEnabled && remoteQuery.isFetching && remoteSessions == null,
    isRemoteDataSource,
  }
}
