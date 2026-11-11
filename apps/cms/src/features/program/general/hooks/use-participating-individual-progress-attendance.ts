import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { isAttendanceRecordingNotOpenError } from '@/features/program/general/lib/attendance-recording-not-open'
import { handleError } from '@/shared/utils/error-handler'
import {
  fetchGeneralProgressAttendanceBundle,
  saveGeneralScheduleAttendances,
} from '@/features/program/general/api/admin-program-progress-service'
import {
  buildAttendanceItemRequest,
  resolveAttendanceWriteFileObjectIds,
  buildProgressAttendanceSessionsFromRemote,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { resolveProgressAttendanceScheduleDateRanges } from '@/features/program/general/lib/progress-attendance-schedule-date-ranges'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { buildParticipatingIndividualProgressAttendanceFilterFields } from '@/features/program/general/lib/participating-individual-progress-attendance-filter-fields'
import { filterProgressAttendanceSessionGroups } from '@/features/program/general/lib/participating-individual-progress-attendance-display'
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

export type ProgressAttendanceViewState =
  | { kind: 'loading' }
  | { kind: 'load_error' }
  | { kind: 'empty' }
  | { kind: 'content'; backgroundRefetchError: boolean }

/** 진행 현황 출석 UI: 정상 빈 결과 vs 조회 실패 vs stale 데이터 유지 */
export function getProgressAttendanceViewState(params: {
  remoteEnabled: boolean
  isLoading: boolean
  isError: boolean
  hasQueryData: boolean
  sessionGroupCount: number
}): ProgressAttendanceViewState {
  if (!params.remoteEnabled) {
    return params.sessionGroupCount === 0 ? { kind: 'empty' } : { kind: 'content', backgroundRefetchError: false }
  }
  if (params.isLoading) return { kind: 'loading' }
  if (params.isError && !params.hasQueryData) return { kind: 'load_error' }
  if (params.sessionGroupCount === 0) return { kind: 'empty' }
  return {
    kind: 'content',
    backgroundRefetchError: params.isError && params.hasQueryData,
  }
}

export function useParticipatingIndividualProgressAttendance(program: Program) {
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

  const scheduleDateRanges = useMemo(
    () => resolveProgressAttendanceScheduleDateRanges(program),
    [program]
  )

  const remoteQuery = useQuery({
    queryKey: [
      ...generalProgramProgressQueryKeys.schedules(String(program.id)),
      'schedule-date-ranges',
      scheduleDateRanges.map(range => `${range.dateFrom}~${range.dateTo}`).join(','),
    ],
    queryFn: () => fetchGeneralProgressAttendanceBundle(String(program.id), scheduleDateRanges),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return null
    return buildProgressAttendanceSessionsFromRemote({
      ...remoteQuery.data,
      program,
    })
  }, [program, remoteEnabled, remoteQuery.data])

  const isRemoteDataSource = remoteEnabled && remoteSessions != null

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
    return filterProgressAttendanceSessionGroups(remoteSessions, appliedFilters)
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

      // 저장 대상이 없으면 성공으로 넘기지 않는다 — 호출부가 「정정 완료」를 잘못 띄우지 않게
      if (!isRemoteDataSource || !participant) {
        throw new Error('출결을 저장할 참여자 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.')
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
            fileObjectIds: isTarget
              ? resolveAttendanceWriteFileObjectIds({
                  attendanceStatus: patch.attendanceStatus,
                  evidenceFileObjectIds: payload.patch.evidenceFileObjectIds,
                })
              : undefined,
          }),
        ]
      })
      await saveGeneralScheduleAttendances(payload.sessionId, requests)
    },
    onSuccess: async () => {
      if (isRemoteDataSource) {
        const programId = String(program.id)
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.schedules(programId),
        })
        await queryClient.invalidateQueries({
          queryKey: [...generalProgramProgressQueryKeys.all, 'attendances', programId],
        })
        await queryClient.invalidateQueries({
          queryKey: [...generalProgramProgressQueryKeys.all, 'program-attendances-bulk', programId],
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.absenceReasons(programId),
        })
      }
    },
    // 사용자 안내는 호출부(회차 패널)가 저장 결과를 await 해서 띄운다. 여기서는 로그만.
    onError: error => {
      if (isAttendanceRecordingNotOpenError(error)) return
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
    ): Promise<void> => saveMutation.mutateAsync({ sessionId, participantRowId, patch }),
    [saveMutation]
  )

  const getSessionParticipants = useCallback(
    (sessionId: string): ParticipatingIndividualProgressAttendanceParticipantRow[] => {
      return remoteSessions?.find(s => s.id === sessionId)?.participants ?? []
    },
    [remoteSessions]
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
  }, [remoteQuery])

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionParticipant,
    isSaving: saveMutation.isPending,
    getSessionParticipants,
    loading: viewState.kind === 'loading',
    loadError: viewState.kind === 'load_error',
    backgroundRefetchError:
      viewState.kind === 'content' ? viewState.backgroundRefetchError : false,
    isEmptyResult: viewState.kind === 'empty',
    refetchAttendance,
    isRefetching: remoteQuery.isRefetching,
    isRemoteDataSource,
  }
}
