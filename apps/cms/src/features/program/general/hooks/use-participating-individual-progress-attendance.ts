import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { formatAttendanceRecordingNotOpenMessage } from '@/features/program/general/lib/attendance-recording-not-open'
import { useCmsAlert } from '@/shared/ui'
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
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { buildParticipatingIndividualProgressAttendanceFilterFields } from '@/features/program/general/lib/participating-individual-progress-attendance-filter-fields'
import { filterProgressAttendanceParticipantsForDisplay } from '@/features/program/general/lib/participating-individual-progress-attendance-display'
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
  const { showAlert } = useCmsAlert()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-progress-attendance',
    '프로그램 진행 현황 · 출석'
  )

  const queryClient = useQueryClient()
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
    if (!isRemoteDataSource || !remoteSessions) return []
    return remoteSessions.map(session => ({
      value: session.filterValue,
      label: session.filterLabel,
    }))
  }, [isRemoteDataSource, remoteSessions])

  const filterFields = useMemo(
    () => buildParticipatingIndividualProgressAttendanceFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const sessionGroups = useMemo(() => {
    if (!isRemoteDataSource || !remoteSessions) return []
    return filterSessionGroups(remoteSessions, appliedFilters)
  }, [appliedFilters, isRemoteDataSource, remoteSessions])

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      sessionId: string
      participantRowId: string
      patch: {
        attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
        lateTime?: string
        remark?: string
        evidenceFileObjectIds?: number[]
      }
    }) => {
      const session = remoteSessions?.find(s => s.id === payload.sessionId)
      const participant = session?.participants.find(p => p.id === payload.participantRowId)

      if (!isRemoteDataSource || !participant) {
        return
      }

      const requests = (session?.participants ?? []).flatMap(row => {
        const isTarget = row.id === payload.participantRowId
        if (!isTarget && !row.attendanceRecorded) return []
        const patch = isTarget
          ? payload.patch
          : {
              attendanceStatus: row.attendanceStatus,
              lateTime: row.lateTime,
              remark: row.remark,
            }
        if (patch.attendanceStatus == null) return []
        return [
          buildAttendanceItemRequest({
            participantId: row.participantId,
            attendanceStatus: patch.attendanceStatus,
            lateTime: patch.lateTime,
            remark: patch.remark,
            fileObjectIds: isTarget ? payload.patch.evidenceFileObjectIds : undefined,
          }),
        ]
      })
      await saveGeneralScheduleAttendances(payload.sessionId, requests)
    },
    onSuccess: async () => {
      if (isRemoteDataSource) {
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.schedules(String(program.id)),
        })
      }
    },
    onError: error => {
      const notOpenMessage = formatAttendanceRecordingNotOpenMessage(error)
      if (notOpenMessage) {
        showAlert({ title: '안내', content: notOpenMessage })
        return
      }
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
        evidenceFileObjectIds?: number[]
      }
    ) => {
      void saveMutation.mutateAsync({ sessionId, participantRowId, patch })
    },
    [saveMutation]
  )

  const getSessionParticipants = useCallback(
    (sessionId: string): ParticipatingIndividualProgressAttendanceParticipantRow[] => {
      return remoteSessions?.find(s => s.id === sessionId)?.participants ?? []
    },
    [remoteSessions]
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
