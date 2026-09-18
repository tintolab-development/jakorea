import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  buildUjatAttendanceSessionsFromMatrix,
  mapUjatUiAttendanceStatusToApi,
} from '@/features/program/ujat/api/allocation-matrix-adapters'
import {
  bulkUpsertUjatAttendances,
  fetchUjatAllocationMatrix,
  fetchUjatScheduleAttendances,
} from '@/features/program/ujat/api/education-execution-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { buildUjatAttendanceFilterFields } from './filter-fields'
import {
  cloneAttendanceVolunteerRows,
  filterVisibleAttendanceVolunteers,
} from './attendance-display'
import {
  EMPTY_UJAT_ATTENDANCE_FILTERS,
  UJAT_ATTENDANCE_FILTER_ALL,
  type UjatAttendanceFilters,
  type UjatAttendanceSessionGroup,
  type UjatAttendanceVolunteerRow,
} from './types'

function volunteerMatchesFilters(
  row: UjatAttendanceVolunteerRow,
  filters: UjatAttendanceFilters
): boolean {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  if (
    filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL &&
    row.status !== filters.attendanceStatus
  ) {
    return false
  }
  return true
}

export function filterAttendanceVolunteersForDisplay(
  volunteers: UjatAttendanceVolunteerRow[],
  filters: UjatAttendanceFilters
): UjatAttendanceVolunteerRow[] {
  const visible = filterVisibleAttendanceVolunteers(volunteers)
  const hasNameOrStatusFilter =
    filters.volunteerName.trim() !== '' ||
    filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL
  if (!hasNameOrStatusFilter) return visible
  return visible.filter(row => volunteerMatchesFilters(row, filters))
}

function filterSessionGroups(
  sessions: UjatAttendanceSessionGroup[],
  filters: UjatAttendanceFilters
): UjatAttendanceSessionGroup[] {
  return sessions
    .filter(session => {
      if (
        filters.educationDate !== UJAT_ATTENDANCE_FILTER_ALL &&
        session.isoDate !== filters.educationDate
      ) {
        return false
      }
      const visibleVolunteers = filterVisibleAttendanceVolunteers(session.volunteers)
      const hasNameOrStatusFilter =
        filters.volunteerName.trim() !== '' ||
        filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL
      if (!hasNameOrStatusFilter) return visibleVolunteers.length > 0
      return visibleVolunteers.some(row => volunteerMatchesFilters(row, filters))
    })
    .map(session => ({
      ...session,
      volunteers: filterVisibleAttendanceVolunteers(session.volunteers),
    }))
}

export function useUjatEducationProgressAttendance(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
  const semesterType = toUjatRecruitHalfApi(half)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-attendance',
    'UJAT 진행 현황 · 출석'
  )

  const [pendingFilters, setPendingFilters] = useState<UjatAttendanceFilters>(() => ({
    ...EMPTY_UJAT_ATTENDANCE_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatAttendanceFilters>(() => ({
    ...EMPTY_UJAT_ATTENDANCE_FILTERS,
  }))
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, UjatAttendanceVolunteerRow[]>
  >({})

  const attendanceQuery = useQuery({
    queryKey: [
      ...ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
      'attendance-sessions',
    ],
    enabled: remoteEnabled,
    queryFn: async () => {
      const matrix = await fetchUjatAllocationMatrix(programId, {
        educationRegionCode,
        semesterType,
      })
      const scheduleIds = [
        ...new Set(
          (matrix.columns ?? [])
            .map(col => col.scheduleId)
            .filter((id): id is number => id != null)
        ),
      ]
      const attendancesByScheduleId: Record<
        string,
        Awaited<ReturnType<typeof fetchUjatScheduleAttendances>>
      > = {}
      await Promise.all(
        scheduleIds.map(async scheduleId => {
          attendancesByScheduleId[String(scheduleId)] = await fetchUjatScheduleAttendances(
            programId,
            scheduleId
          ).catch(() => [])
        })
      )
      return buildUjatAttendanceSessionsFromMatrix({
        matrix,
        attendancesByScheduleId,
        regionKey,
        half,
      })
    },
  })

  const remoteSessions = attendanceQuery.data ?? []

  const sessionsWithOverrides = useMemo(() => {
    if (Object.keys(localOverrides).length === 0) return remoteSessions
    return remoteSessions.map(session => {
      const override = localOverrides[session.id]
      if (!override) return session
      return { ...session, volunteers: override }
    })
  }, [localOverrides, remoteSessions])

  const educationDateOptions = useMemo(() => {
    const seen = new Set<string>()
    return remoteSessions.reduce<{ value: string; label: string }[]>((acc, session) => {
      if (!session.isoDate || seen.has(session.isoDate)) return acc
      seen.add(session.isoDate)
      acc.push({ value: session.isoDate, label: session.dateLabel })
      return acc
    }, [])
  }, [remoteSessions])

  const filterFields = useMemo(
    () => buildUjatAttendanceFilterFields(educationDateOptions),
    [educationDateOptions]
  )

  const sessionGroups = useMemo(
    () => filterSessionGroups(sessionsWithOverrides, appliedFilters),
    [appliedFilters, sessionsWithOverrides]
  )

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
    setLocalOverrides({})
  }, [])

  const saveMutation = useMutation({
    mutationFn: async (params: {
      sessionId: string
      volunteers: UjatAttendanceVolunteerRow[]
    }) => {
      const session = remoteSessions.find(s => s.id === params.sessionId)
      const scheduleIdNum = Number(session?.scheduleId)
      if (!session?.scheduleId || !Number.isFinite(scheduleIdNum)) {
        throw new Error('MISSING_SCHEDULE_ID')
      }
      await bulkUpsertUjatAttendances(programId, {
        scheduleId: scheduleIdNum,
        attendances: params.volunteers.map(row => ({
          participantId: Number(row.id),
          status: mapUjatUiAttendanceStatusToApi(row.status),
          absenceReason: row.excusedReason ?? null,
          arrivalTime: row.checkInTime ?? null,
        })),
      })
    },
    onSuccess: async (_data, variables) => {
      setLocalOverrides(prev => {
        const next = { ...prev }
        delete next[variables.sessionId]
        return next
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
      })
      showAlert({ title: '안내', content: '출석이 저장되었습니다.' })
    },
    onError: () => {
      showAlert({
        title: '오류',
        content: '출석 저장에 실패했습니다.',
      })
    },
  })

  const saveSessionVolunteers = useCallback(
    (sessionId: string, volunteers: UjatAttendanceVolunteerRow[]) => {
      setLocalOverrides(prev => ({ ...prev, [sessionId]: cloneAttendanceVolunteerRows(volunteers) }))
      if (!remoteEnabled) return
      saveMutation.mutate({ sessionId, volunteers })
    },
    [remoteEnabled, saveMutation]
  )

  const getSessionVolunteers = useCallback(
    (sessionId: string): UjatAttendanceVolunteerRow[] => {
      const override = localOverrides[sessionId]
      if (override) return cloneAttendanceVolunteerRows(filterVisibleAttendanceVolunteers(override))
      const session = sessionsWithOverrides.find(s => s.id === sessionId)
      if (!session) return []
      return cloneAttendanceVolunteerRows(filterVisibleAttendanceVolunteers(session.volunteers))
    },
    [localOverrides, sessionsWithOverrides]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    resetRegionState,
    saveSessionVolunteers,
    getSessionVolunteers,
    isLoading: remoteEnabled && attendanceQuery.isLoading,
  }
}
