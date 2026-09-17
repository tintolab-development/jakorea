import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  fetchSchoolDetailAttendanceBundle,
  saveSchoolDetailAttendanceSessionRemote,
} from '@/features/program/general/api/school-detail-attendance-api'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { handleError } from '@/shared/utils/error-handler'
import { buildSchoolDetailAttendanceFilterFields } from '../lib/school-detail-attendance-filter-fields'
import {
  cloneAttendanceStudentRows,
  filterAttendanceStudentsForDisplay,
} from '../lib/school-detail-attendance-display'
import {
  getSchoolDetailAttendanceEducationScheduleOptions,
  mergeSchoolDetailAttendanceRemoteData,
  resolveAttendanceSessions,
} from '../lib/school-detail-attendance'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  type SchoolDetailAttendanceFilters,
  type SchoolDetailAttendanceSessionGroup,
  type SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'

export const EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS: SchoolDetailAttendanceFilters = {
  educationSchedule: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentName: '',
  studentGender: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentClass: SCHOOL_ATTENDANCE_FILTER_ALL,
  attendanceStatus: SCHOOL_ATTENDANCE_FILTER_ALL,
}

function filterSessionGroups(
  sessions: SchoolDetailAttendanceSessionGroup[],
  filters: SchoolDetailAttendanceFilters
): SchoolDetailAttendanceSessionGroup[] {
  const filteredBySchedule =
    filters.educationSchedule === SCHOOL_ATTENDANCE_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  return filteredBySchedule
    .map(session => ({
      ...session,
      students: filterAttendanceStudentsForDisplay(session.students, filters),
    }))
    .filter(session => session.students.length > 0)
}

function institutionAttendanceQueryKey(
  programId: string,
  organizationApplicationId: string,
  scheduleIdsKey: string
) {
  return [
    ...generalProgramProgressQueryKeys.all,
    'institution-attendance',
    programId,
    organizationApplicationId,
    scheduleIdsKey,
  ] as const
}

export function useSchoolDetailAttendance(row: ParticipatingSchoolRow, program: Program) {
  const queryClient = useQueryClient()
  const programId = String(row.programId ?? program.id ?? '').trim()
  const organizationApplicationId =
    row.organizationApplicationId != null && String(row.organizationApplicationId).trim() !== ''
      ? String(row.organizationApplicationId)
      : ''
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId || undefined)
  const applicationsRemoteEnabled = shouldUseGeneralApplicationsRemoteApi()
  const remoteEnabled = Boolean(
    progressRemoteEnabled &&
      applicationsRemoteEnabled &&
      programId &&
      organizationApplicationId
  )

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-institution-attendance',
    '참여 기관 · 출석 관리'
  )

  const sessions = useMemo(() => resolveAttendanceSessions(row), [row])
  const scheduleIdsKey = useMemo(
    () =>
      sessions
        .map(session => session.resolvedScheduleId)
        .filter(
          (id): id is number =>
            typeof id === 'number' && Number.isFinite(id) && id > 0
        )
        .sort((a, b) => a - b)
        .join(','),
    [sessions]
  )

  const remoteQuery = useQuery({
    queryKey: institutionAttendanceQueryKey(
      programId || '__none__',
      organizationApplicationId || '__none__',
      scheduleIdsKey || '__none__'
    ),
    enabled: remoteEnabled,
    queryFn: () =>
      fetchSchoolDetailAttendanceBundle({
        programId,
        organizationApplicationId,
        sessions,
      }),
    staleTime: 15_000,
    retry: false,
  })

  useEffect(() => {
    if (remoteQuery.isError && remoteQuery.error) {
      handleError(remoteQuery.error, { context: 'useSchoolDetailAttendance.load' })
    }
  }, [remoteQuery.error, remoteQuery.isError])

  const [pendingFilters, setPendingFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )

  const educationScheduleOptions = useMemo(
    () => getSchoolDetailAttendanceEducationScheduleOptions(row, program),
    [program, row]
  )

  const filterFields = useMemo(
    () => buildSchoolDetailAttendanceFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const remoteSessionGroups = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return []
    return mergeSchoolDetailAttendanceRemoteData({
      row,
      program,
      rosterStudents: remoteQuery.data.rosterStudents,
      attendancesByScheduleId: remoteQuery.data.attendancesByScheduleId,
    })
  }, [program, remoteEnabled, remoteQuery.data, row])

  const sessionGroups = useMemo(() => {
    if (!remoteEnabled) return []
    return filterSessionGroups(remoteSessionGroups, appliedFilters)
  }, [appliedFilters, remoteEnabled, remoteSessionGroups])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      sessionId: string
      students: SchoolDetailAttendanceStudentRow[]
    }) => {
      if (!remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-institution-attendance-save',
          '참여 기관 · 출석 관리 저장'
        )
        throw new Error('institution attendance remote unavailable')
      }
      const session = remoteSessionGroups.find(item => item.id === payload.sessionId)
      const scheduleId = session?.scheduleId
      if (scheduleId == null || !(scheduleId > 0)) {
        notifyProgramApiUnavailable(
          'general-institution-attendance-schedule',
          '참여 기관 · 출석 관리 (일정 미매핑)'
        )
        throw new Error('scheduleId unresolved')
      }
      await saveSchoolDetailAttendanceSessionRemote({
        programId,
        scheduleId,
        students: payload.students,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          ...generalProgramProgressQueryKeys.all,
          'institution-attendance',
          programId,
          organizationApplicationId,
        ],
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.studentRoster(organizationApplicationId),
      })
    },
    onError: error => {
      handleError(error, { context: 'useSchoolDetailAttendance.save' })
    },
  })

  const saveSessionStudents = useCallback(
    async (sessionId: string, students: SchoolDetailAttendanceStudentRow[]) => {
      await saveMutation.mutateAsync({ sessionId, students })
    },
    [saveMutation]
  )

  const getSessionStudents = useCallback(
    (sessionId: string): SchoolDetailAttendanceStudentRow[] => {
      const session = remoteSessionGroups.find(item => item.id === sessionId)
      return cloneAttendanceStudentRows(session?.students ?? [])
    },
    [remoteSessionGroups]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
    loading: remoteEnabled && remoteQuery.isFetching && remoteQuery.data == null,
    isSaving: saveMutation.isPending,
    remoteEnabled,
  }
}
