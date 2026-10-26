import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import {
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  fetchSchoolDetailAttendanceBundle,
  saveSchoolDetailAttendanceSessionRemote,
} from '@/features/program/general/api/school-detail-attendance-api'
import { fetchOrganizationScheduleAssignmentsRemote } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { organizationScheduleAssignmentsQueryKey } from '@/features/program/general/lib/organization-education-schedule-sources'
import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
import { isParticipatingInstitutionStudentListApplicable } from '@/features/program/general/lib/participating-institution-detail-tabs'
import {
  evaluateOrganizationAttendanceScopeReadiness,
  formatOrganizationAttendanceScopeBlockedDescription,
  ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE,
  resolveOrganizationAttendanceScopeErrorMessage,
  type OrganizationAttendanceScopeReadiness,
} from '@/features/program/general/lib/organization-schedule-attendance-scope'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { isAttendanceRecordingNotOpenError } from '@/features/program/general/lib/attendance-recording-not-open'
import { buildSchoolDetailAttendanceFilterFields } from '../lib/school-detail-attendance-filter-fields'
import { buildStudentClassFilterOptionsFromRows } from '../lib/student-list-filter-fields'
import {
  cloneAttendanceStudentRows,
  filterAttendanceStudentsForDisplay,
  hasSchoolDetailAttendanceStudentFilters,
  isDefaultSchoolDetailAttendanceFilters,
} from '../lib/school-detail-attendance-display'
import {
  getSchoolDetailAttendanceEducationScheduleOptions,
  mergeSchoolDetailAttendanceRemoteData,
  resolveSchoolDetailAttendanceSessions,
  SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES,
} from '../lib/school-detail-attendance'
import { buildSchoolDetailAttendanceExcelRows } from '../lib/school-detail-attendance-export'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  type SchoolDetailAttendanceFilters,
  type SchoolDetailAttendanceSessionGroup,
  type SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'
import { getProgressAttendanceViewState } from './use-participating-individual-progress-attendance'

export const EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS: SchoolDetailAttendanceFilters = {
  educationSchedule: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentName: '',
  studentGender: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentClass: SCHOOL_ATTENDANCE_FILTER_ALL,
  attendanceStatus: SCHOOL_ATTENDANCE_FILTER_ALL,
}

export type SchoolDetailAttendanceEmptyKind =
  | 'none'
  | 'no_assigned_schedules'
  | 'no_filter_match'
  | 'assignment_scope_unavailable'

function filterSessionGroups(
  sessions: SchoolDetailAttendanceSessionGroup[],
  filters: SchoolDetailAttendanceFilters
): SchoolDetailAttendanceSessionGroup[] {
  const filteredBySchedule =
    filters.educationSchedule === SCHOOL_ATTENDANCE_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  const studentFiltersApplied = hasSchoolDetailAttendanceStudentFilters(filters)
  return filteredBySchedule
    .map(session => ({
      ...session,
      students: filterAttendanceStudentsForDisplay(session.students, filters),
    }))
    .filter(session => !studentFiltersApplied || session.students.length > 0)
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
  const { showAlert } = useCmsAlert()
  const programId = String(row.programId ?? program.id ?? '').trim()
  const organizationApplicationId =
    row.organizationApplicationId != null && String(row.organizationApplicationId).trim() !== ''
      ? String(row.organizationApplicationId)
      : ''
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId || undefined)
  const applicationsRemoteEnabled = shouldUseOrganizationApplicationRemoteApi()
  const trainedTeacherAttendanceRemoteEnabled =
    useIsTrainedTeachersProgramsSurface() && shouldUseTrainedTeacherProgramsRemoteApi()
  const studentListApplicable = isParticipatingInstitutionStudentListApplicable(program)
  const remoteEnabled = Boolean(
    (progressRemoteEnabled || trainedTeacherAttendanceRemoteEnabled) &&
      (applicationsRemoteEnabled || trainedTeacherAttendanceRemoteEnabled) &&
      studentListApplicable &&
      programId &&
      organizationApplicationId
  )
  const requiresAssignmentScopeForAttendance =
    remoteEnabled && isGeneralOrganizationProgram(program)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-institution-attendance',
    '참여 기관 · 출석 관리'
  )

  const assignmentScopeQuery = useQuery({
    queryKey: organizationScheduleAssignmentsQueryKey(
      programId || '__none__',
      organizationApplicationId || '__none__'
    ),
    enabled: requiresAssignmentScopeForAttendance,
    queryFn: () =>
      fetchOrganizationScheduleAssignmentsRemote(programId, organizationApplicationId),
    staleTime: 15_000,
    retry: false,
  })

  const programSchedulesQuery = useQuery({
    queryKey: generalProgramQueryKeys.schedules(programId || '__none__'),
    enabled: requiresAssignmentScopeForAttendance,
    queryFn: () => fetchAdminProgramSchedulesRemote(programId),
    staleTime: 60_000,
    retry: false,
  })

  const assignmentScopeReady =
    !requiresAssignmentScopeForAttendance || assignmentScopeQuery.isSuccess
  const assignedSessions = useMemo(
    () =>
      resolveSchoolDetailAttendanceSessions({
        row,
        isGeneralOrganization: requiresAssignmentScopeForAttendance,
        assignmentSlots: assignmentScopeQuery.data,
        programSchedules: programSchedulesQuery.data,
        assignmentScopeReady,
      }),
    [
      assignmentScopeQuery.data,
      assignmentScopeReady,
      programSchedulesQuery.data,
      requiresAssignmentScopeForAttendance,
      row,
    ]
  )
  const scheduleIdsKey = useMemo(
    () =>
      assignedSessions
        .map(session => session.resolvedScheduleId)
        .filter(
          (id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0
        )
        .sort((a, b) => a - b)
        .join(','),
    [assignedSessions]
  )

  const attendanceQueryEnabled =
    remoteEnabled && assignmentScopeReady && assignedSessions.length > 0

  const remoteQuery = useQuery({
    queryKey: institutionAttendanceQueryKey(
      programId || '__none__',
      organizationApplicationId || '__none__',
      scheduleIdsKey || '__none__'
    ),
    enabled: attendanceQueryEnabled,
    queryFn: () =>
      fetchSchoolDetailAttendanceBundle({
        programId,
        organizationApplicationId,
        sessions: assignedSessions,
      }),
    staleTime: 15_000,
    retry: false,
  })

  const [pendingFilters, setPendingFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )

  const remoteSessionGroups = useMemo(() => {
    if (!remoteEnabled) return []
    if (assignedSessions.length === 0) return []
    if (remoteQuery.data == null) return []
    return mergeSchoolDetailAttendanceRemoteData({
      row,
      program,
      sessions: assignedSessions,
      rosterStudents: remoteQuery.data.rosterStudents,
      attendancesByScheduleId: remoteQuery.data.attendancesByScheduleId,
      giveUpParticipants: remoteQuery.data.giveUpParticipants,
    })
  }, [
    assignedSessions,
    program,
    remoteEnabled,
    remoteQuery.data,
    row,
  ])

  const educationScheduleOptions = useMemo(() => {
    if (remoteEnabled && !assignmentScopeReady) return []
    return getSchoolDetailAttendanceEducationScheduleOptions(row, program, assignedSessions)
  }, [assignedSessions, assignmentScopeReady, program, remoteEnabled, row])

  const studentClassOptions = useMemo(
    () => buildStudentClassFilterOptionsFromRows(remoteQuery.data?.rosterStudents ?? []),
    [remoteQuery.data?.rosterStudents]
  )

  const filterFields = useMemo(
    () => buildSchoolDetailAttendanceFilterFields(educationScheduleOptions, studentClassOptions),
    [educationScheduleOptions, studentClassOptions]
  )

  const sessionGroups = useMemo(() => {
    if (!remoteEnabled) return []
    return filterSessionGroups(remoteSessionGroups, appliedFilters)
  }, [appliedFilters, remoteEnabled, remoteSessionGroups])

  const sessionScopeReadinessBySessionId = useMemo(() => {
    if (!requiresAssignmentScopeForAttendance) return {}
    if (assignmentScopeQuery.data == null) return {}

    const rosterStudents = remoteQuery.data?.rosterStudents ?? []
    const readinessBySessionId: Record<string, OrganizationAttendanceScopeReadiness> = {}

    for (const session of remoteSessionGroups) {
      const scheduleId = session.scheduleId
      if (scheduleId == null || !(scheduleId > 0)) {
        readinessBySessionId[session.id] = {
          ready: false,
          missingStep: 'SCHEDULE_ASSIGNMENT',
          unassignedStudentCount: rosterStudents.filter(
            student =>
              student.participantId != null &&
              Number.isFinite(Number(student.participantId)) &&
              Number(student.participantId) > 0
          ).length,
          missingByGradeClass: [],
        }
        continue
      }

      readinessBySessionId[session.id] = evaluateOrganizationAttendanceScopeReadiness({
        programId,
        organizationApplicationId,
        scheduleId,
        educationGrade: row.educationGrade,
        rosterStudents,
        assignmentSlots: assignmentScopeQuery.data,
      })
    }

    return readinessBySessionId
  }, [
    assignmentScopeQuery.data,
    organizationApplicationId,
    programId,
    remoteQuery.data?.rosterStudents,
    remoteSessionGroups,
    requiresAssignmentScopeForAttendance,
    row.educationGrade,
  ])

  const getSessionScopeReadiness = useCallback(
    (sessionId: string): OrganizationAttendanceScopeReadiness | undefined => {
      if (!requiresAssignmentScopeForAttendance) return undefined
      return sessionScopeReadinessBySessionId[sessionId]
    },
    [requiresAssignmentScopeForAttendance, sessionScopeReadinessBySessionId]
  )

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
      if (
        session == null ||
        session.scheduleIdUnresolved ||
        scheduleId == null ||
        !(scheduleId > 0)
      ) {
        showAlert({
          title: '출석 저장 안내',
          content: '교육 일정 ID를 확인할 수 없어 출석을 저장할 수 없습니다.',
        })
        throw new Error('scheduleId unresolved')
      }
      if (requiresAssignmentScopeForAttendance) {
        if (assignmentScopeQuery.isLoading || assignmentScopeQuery.data == null) {
          showAlert({
            title: ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE,
            content:
              '학급 일정 배정 정보를 확인하는 중입니다. 잠시 후 다시 시도해 주세요.',
          })
          throw new Error('attendance assignment scope pending')
        }
        const scopeReadiness = evaluateOrganizationAttendanceScopeReadiness({
          programId,
          organizationApplicationId,
          scheduleId,
          educationGrade: row.educationGrade,
          rosterStudents: remoteQuery.data?.rosterStudents ?? [],
          assignmentSlots: assignmentScopeQuery.data,
        })
        if (!scopeReadiness.ready) {
          showAlert({
            title: ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE,
            content: formatOrganizationAttendanceScopeBlockedDescription(
              scopeReadiness,
              session?.headerTitle
            ),
          })
          throw new Error('attendance assignment scope not ready')
        }
      }
      await saveSchoolDetailAttendanceSessionRemote({
        programId,
        scheduleId,
        organizationApplicationId,
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
        queryKey: [...generalProgramProgressQueryKeys.all, 'program-attendances-bulk', programId],
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.studentRoster(organizationApplicationId),
      })
      if (requiresAssignmentScopeForAttendance) {
        await queryClient.invalidateQueries({
          queryKey: organizationScheduleAssignmentsQueryKey(programId, organizationApplicationId),
        })
      }
    },
    onError: error => {
      if (isAttendanceRecordingNotOpenError(error)) return
      const scopeMessage = resolveOrganizationAttendanceScopeErrorMessage(error)
      if (scopeMessage) {
        showAlert({
          title: ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE,
          content: scopeMessage,
        })
        return
      }
      if (
        error instanceof Error &&
        (error.message === 'attendance assignment scope not ready' ||
          error.message === 'attendance assignment scope pending' ||
          error.message === 'scheduleId unresolved')
      ) {
        return
      }
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

  const assignmentScopePending =
    requiresAssignmentScopeForAttendance &&
    (assignmentScopeQuery.isLoading || assignmentScopeQuery.isPending)
  const attendancePending = attendanceQueryEnabled && remoteQuery.isLoading
  const loading = assignmentScopePending || attendancePending

  const emptyKind: SchoolDetailAttendanceEmptyKind = useMemo(() => {
    if (loading) return 'none'
    if (requiresAssignmentScopeForAttendance && assignmentScopeQuery.isError) {
      return 'assignment_scope_unavailable'
    }
    if (assignedSessions.length === 0) return 'no_assigned_schedules'
    if (sessionGroups.length === 0) {
      return isDefaultSchoolDetailAttendanceFilters(appliedFilters)
        ? 'no_assigned_schedules'
        : 'no_filter_match'
    }
    return 'none'
  }, [
    appliedFilters,
    assignedSessions.length,
    assignmentScopeQuery.isError,
    loading,
    requiresAssignmentScopeForAttendance,
    sessionGroups.length,
  ])

  const viewState = useMemo(
    () =>
      getProgressAttendanceViewState({
        remoteEnabled,
        isLoading: loading,
        isError: remoteQuery.isError,
        hasQueryData: remoteQuery.data != null || assignedSessions.length === 0,
        sessionGroupCount: emptyKind === 'none' ? Math.max(sessionGroups.length, 1) : 0,
      }),
    [
      assignedSessions.length,
      emptyKind,
      loading,
      remoteEnabled,
      remoteQuery.data,
      remoteQuery.isError,
      sessionGroups.length,
    ]
  )

  const refetchAttendance = useCallback(() => {
    void remoteQuery.refetch()
    if (requiresAssignmentScopeForAttendance) {
      void assignmentScopeQuery.refetch()
      void programSchedulesQuery.refetch()
    }
  }, [
    assignmentScopeQuery,
    programSchedulesQuery,
    remoteQuery,
    requiresAssignmentScopeForAttendance,
  ])

  const resolveExcelExportRows = useCallback(
    () => buildSchoolDetailAttendanceExcelRows(remoteSessionGroups),
    [remoteSessionGroups]
  )

  const canExportAll =
    remoteEnabled &&
    assignedSessions.length > 0 &&
    remoteQuery.isSuccess &&
    (!requiresAssignmentScopeForAttendance || assignmentScopeQuery.isSuccess)

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
    loading: viewState.kind === 'loading',
    loadError: viewState.kind === 'load_error',
    backgroundRefetchError:
      viewState.kind === 'content' ? viewState.backgroundRefetchError : false,
    isEmptyResult: viewState.kind === 'empty',
    emptyKind,
    emptyMessage:
      emptyKind === 'no_assigned_schedules'
        ? SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.noAssignedSchedules
        : emptyKind === 'assignment_scope_unavailable'
          ? SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.assignmentScopeUnavailable
          : SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.noFilterMatch,
    refetchAttendance,
    isRefetching: remoteQuery.isRefetching,
    isSaving: saveMutation.isPending,
    remoteEnabled,
    requiresAssignmentScopeForAttendance,
    assignmentScopeLoading: assignmentScopeQuery.isLoading,
    assignmentScopeLoadError: assignmentScopeQuery.isError,
    getSessionScopeReadiness,
    resolveExcelExportRows,
    canExportAll,
  }
}
