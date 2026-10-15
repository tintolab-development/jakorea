import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  fetchSchoolDetailAttendanceBundle,
  saveSchoolDetailAttendanceSessionRemote,
} from '@/features/program/general/api/school-detail-attendance-api'
import { fetchOrganizationScheduleAssignmentsRemote } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
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
import { getProgressAttendanceViewState } from './use-participating-individual-progress-attendance'

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

function organizationScheduleAssignmentsQueryKey(
  programId: string,
  organizationApplicationId: string
) {
  return [
    ...generalProgramProgressQueryKeys.all,
    'organization-schedule-assignments',
    programId,
    organizationApplicationId,
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
  const remoteEnabled = Boolean(
    progressRemoteEnabled &&
      applicationsRemoteEnabled &&
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

  const [pendingFilters, setPendingFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
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

  const educationScheduleOptions = useMemo(() => {
    // The program schedule list also contains institution-unassigned rows.
    // After the attendance response arrives, expose only its canonical groups.
    if (remoteEnabled) {
      if (remoteQuery.data == null) return []
      return remoteSessionGroups.map(session => ({
        label: session.headerTitle,
        value: session.filterValue,
      }))
    }
    return getSchoolDetailAttendanceEducationScheduleOptions(row, program)
  }, [program, remoteEnabled, remoteQuery.data, remoteSessionGroups, row])

  const filterFields = useMemo(
    () => buildSchoolDetailAttendanceFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
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
      if (scheduleId == null || !(scheduleId > 0)) {
        notifyProgramApiUnavailable(
          'general-institution-attendance-schedule',
          '참여 기관 · 출석 관리 (일정 미매핑)'
        )
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
          error.message === 'attendance assignment scope pending')
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

  const viewState = useMemo(
    () =>
      getProgressAttendanceViewState({
        remoteEnabled,
        isLoading: remoteQuery.isLoading,
        isError: remoteQuery.isError,
        hasQueryData: remoteQuery.data != null,
        sessionGroupCount: sessionGroups.length,
      }),
    [
      remoteEnabled,
      remoteQuery.data,
      remoteQuery.isError,
      remoteQuery.isLoading,
      sessionGroups.length,
    ]
  )

  const refetchAttendance = useCallback(() => {
    void remoteQuery.refetch()
    if (requiresAssignmentScopeForAttendance) {
      void assignmentScopeQuery.refetch()
    }
  }, [assignmentScopeQuery, remoteQuery, requiresAssignmentScopeForAttendance])

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
    refetchAttendance,
    isRefetching: remoteQuery.isRefetching,
    isSaving: saveMutation.isPending,
    remoteEnabled,
    requiresAssignmentScopeForAttendance,
    assignmentScopeLoading: assignmentScopeQuery.isLoading,
    assignmentScopeLoadError: assignmentScopeQuery.isError,
    getSessionScopeReadiness,
  }
}
