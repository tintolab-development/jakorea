import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import {
  ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE,
  isInvalidAttendanceArrivalTimeError,
} from '@/shared/lib/attendance-arrival-time'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  buildUjatAttendanceSessionsFromMatrix,
} from '@/features/program/ujat/api/allocation-matrix-adapters'
import {
  bulkUpsertUjatAttendances,
  fetchUjatAllocationMatrix,
  fetchUjatAttendancesByScheduleIds,
} from '@/features/program/ujat/api/education-execution-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { buildUjatAttendanceFilterFields } from './filter-fields'
import { buildUjatAttendanceCorrectionBulkItem } from './attendance-correction-bulk'
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
  const hasEducationRegionCode = Boolean(educationRegionCode)
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

  const attendanceQuery = useQuery({
    queryKey: [
      ...ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
      'attendance-sessions',
    ],
    enabled: remoteEnabled && hasEducationRegionCode,
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
      // 출석 조회 실패를 빈 배열로 숨기지 않는다 — remote 응답만 SSOT
      const attendancesByScheduleId = await fetchUjatAttendancesByScheduleIds(
        programId,
        scheduleIds
      )
      return buildUjatAttendanceSessionsFromMatrix({
        matrix,
        attendancesByScheduleId,
        regionKey,
        half,
      })
    },
  })

  const remoteSessions = useMemo(
    () => (remoteEnabled && !attendanceQuery.isError ? (attendanceQuery.data ?? []) : []),
    [attendanceQuery.data, attendanceQuery.isError, remoteEnabled]
  )

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
    setPendingFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
  }, [])

  const saveMutation = useMutation({
    mutationFn: async (params: {
      sessionId: string
      correctedVolunteer: UjatAttendanceVolunteerRow
    }) => {
      if (!remoteEnabled) throw new Error('REMOTE_DISABLED')
      const session = remoteSessions.find(s => s.id === params.sessionId)
      const scheduleIdNum = Number(session?.scheduleId)
      if (!session?.scheduleId || !Number.isFinite(scheduleIdNum)) {
        throw new Error('MISSING_SCHEDULE_ID')
      }
      await bulkUpsertUjatAttendances(programId, {
        scheduleId: scheduleIdNum,
        attendances: [buildUjatAttendanceCorrectionBulkItem(params.correctedVolunteer)],
      })
    },
    onSuccess: async () => {
      // 정정 결과는 재조회한 GET 응답으로만 표시한다 (refetch 완료 후 모달 닫힘)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
        }),
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.volunteer1365AttendanceAll(programId),
        }),
      ])
    },
    onError: error => {
      showAlert({
        title: '오류',
        content: isInvalidAttendanceArrivalTimeError(error)
          ? ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE
          : '출결 정정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    },
  })

  const { mutateAsync: saveSessionMutateAsync } = saveMutation

  const correctSessionVolunteerAttendance = useCallback(
    async (sessionId: string, correctedVolunteer: UjatAttendanceVolunteerRow) => {
      await saveSessionMutateAsync({ sessionId, correctedVolunteer })
    },
    [saveSessionMutateAsync]
  )

  const getSessionVolunteers = useCallback(
    (sessionId: string): UjatAttendanceVolunteerRow[] => {
      const session = remoteSessions.find(s => s.id === sessionId)
      if (!session) return []
      return cloneAttendanceVolunteerRows(filterVisibleAttendanceVolunteers(session.volunteers))
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
    resetRegionState,
    correctSessionVolunteerAttendance,
    savingSessionId: saveMutation.isPending ? (saveMutation.variables?.sessionId ?? null) : null,
    getSessionVolunteers,
    isLoading: remoteEnabled && (!hasEducationRegionCode || attendanceQuery.isLoading),
    isError: remoteEnabled && hasEducationRegionCode && attendanceQuery.isError,
    isRemote: remoteEnabled,
  }
}
