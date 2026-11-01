import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import {
  ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE,
  isInvalidAttendanceArrivalTimeError,
} from '@/shared/lib/attendance-arrival-time'
import {
  ATTENDANCE_CORRECTION_NOT_OPEN_ALERT,
  isAttendanceRecordingNotOpenError,
} from '@/features/program/general/lib/attendance-recording-not-open'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { EducationProgressHalfKey } from '../../tabs'
import { resolveAssignmentCancelErrorAlert } from './assignment-cancel-errors'
import {
  cancelVolunteerAssignment,
  confirmVolunteerAssignment,
  correctVolunteerAttendance,
  invalidateVolunteerAssignmentQueries,
  updateVolunteerScheduleRole,
} from './assignment-progress-actions'
import { loadVolunteerAssignmentProgress } from './assignment-progress-load'
import { UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE } from './assignment-progress-adapter'
import type {
  UjatVolunteerAssignmentProgressRow,
  UjatVolunteerScheduleRole,
} from './assignment-types'
import type { UjatVolunteerAssignmentAssignModalMode } from './volunteer-assign-modal-data'

function finiteId(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function useVolunteerAssignmentProgress(input: {
  programId: string
  half: EducationProgressHalfKey
  memberId?: string | null
  regionKey?: string | null
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const memberId = input.memberId?.trim() ?? ''
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(input.programId)
  const semesterType = toUjatRecruitHalfApi(input.half)
  const regionKey = input.regionKey?.trim() ?? ''
  // 빈 지역 키를 SEOUL로 바꾸면 다른 지역 배정을 이 봉사자 것으로 보여 준다.
  const educationRegionCode = regionKey ? toUjatEducationRegionCode(regionKey) : undefined
  const regionCacheKey = educationRegionCode ?? 'ALL'
  const enabled = remoteEnabled && memberId.length > 0

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-volunteer-assignment-progress',
    'UJAT 봉사자 상세 · 배정/출결'
  )

  const progressQuery = useQuery({
    queryKey: ujatQueryKeys.volunteerAssignmentProgress(
      input.programId,
      memberId,
      semesterType,
      regionCacheKey
    ),
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () =>
      loadVolunteerAssignmentProgress({
        programId: input.programId,
        memberId,
        semesterType,
        educationRegionCode,
      }),
  })

  const invalidate = useCallback(async () => {
    const resolvedRegion =
      progressQuery.data?.educationRegionCode || educationRegionCode || 'ALL'
    await invalidateVolunteerAssignmentQueries(queryClient, {
      programId: input.programId,
      educationRegionCode: resolvedRegion,
      semesterType,
    })
  }, [
    educationRegionCode,
    input.programId,
    progressQuery.data?.educationRegionCode,
    queryClient,
    semesterType,
  ])

  const showMutationError = useCallback(
    (error: unknown, fallback: string) => {
      if (isAttendanceRecordingNotOpenError(error)) {
        showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
        return
      }
      const cancelAlert = resolveAssignmentCancelErrorAlert(error)
      if (cancelAlert) {
        showAlert({ title: cancelAlert.title, content: cancelAlert.content })
        if (cancelAlert.shouldRefresh) void invalidate()
        return
      }
      showAlert({
        title: '오류',
        content: isInvalidAttendanceArrivalTimeError(error)
          ? ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE
          : fallback,
      })
    },
    [invalidate, showAlert]
  )

  const cancelMutation = useMutation({
    mutationFn: cancelVolunteerAssignment,
    retry: false,
    onSuccess: () => invalidate(),
    onError: error => showMutationError(error, '교육 배정 취소에 실패했습니다.'),
  })

  const confirmMutation = useMutation({
    mutationFn: confirmVolunteerAssignment,
    retry: false,
    onSuccess: () => invalidate(),
    onError: (error, variables) =>
      showMutationError(
        error,
        variables.mode === 'partner' ? '파트너 배정에 실패했습니다.' : '교육 배정에 실패했습니다.'
      ),
  })

  const attendanceMutation = useMutation({
    mutationFn: correctVolunteerAttendance,
    retry: false,
    onSuccess: () => invalidate(),
    onError: error => showMutationError(error, '출결 정정에 실패했습니다.'),
  })

  const roleMutation = useMutation({
    mutationFn: updateVolunteerScheduleRole,
    retry: false,
    onSuccess: () => invalidate(),
    onError: error => showMutationError(error, '역할 변경에 실패했습니다.'),
  })

  const cancelAssignment = useCallback(
    (
      row: UjatVolunteerAssignmentProgressRow,
      payload: {
        reason?: string | null
        timing?: 'IMMEDIATE' | 'SCHEDULED' | null
        scheduledAt?: string | null
      } = {}
    ) => {
      if (row.scheduleId == null || !row.assignmentGroupId) {
        throw new Error('MISSING_ASSIGNMENT_GROUP')
      }
      return cancelMutation.mutateAsync({
        programId: input.programId,
        scheduleId: row.scheduleId,
        assignmentGroupId: row.assignmentGroupId,
        ...payload,
      })
    },
    [cancelMutation, input.programId]
  )

  const confirmAssignment = useCallback(
    (payload: {
      row: UjatVolunteerAssignmentProgressRow
      mode: UjatVolunteerAssignmentAssignModalMode
      classValue: string
      partnerId: string
      classLabel?: string | null
    }) => {
      const participantId = payload.row.participantId
      const partnerParticipantId = finiteId(payload.partnerId)
      if (participantId == null || partnerParticipantId == null) {
        throw new Error('MISSING_PARTICIPANT')
      }
      if (payload.row.scheduleId == null) throw new Error('MISSING_SCHEDULE')
      const slotFromSelection = payload.mode === 'education' ? finiteId(payload.classValue) : null
      const educationSlotId =
        payload.mode === 'education' ? slotFromSelection : (payload.row.educationSlotId ?? null)
      return confirmMutation.mutateAsync({
        programId: input.programId,
        mode: payload.mode,
        scheduleId: payload.row.scheduleId,
        participantId,
        partnerParticipantId,
        selfIsSecondary: payload.row.selfIsSecondary,
        educationSlotId,
        organizationApplicationId: payload.row.organizationApplicationId,
        classLabel:
          payload.classLabel ??
          (payload.row.classDisplay.kind === 'class' ? payload.row.classDisplay.label : null),
      })
    },
    [confirmMutation, input.programId]
  )

  const correctAttendance = useCallback(
    (row: UjatVolunteerAssignmentProgressRow, payload: ProgramAttendanceCorrectionConfirmPayload) => {
      if (row.scheduleId == null || row.participantId == null) {
        throw new Error('MISSING_ATTENDANCE_TARGET')
      }
      return attendanceMutation.mutateAsync({
        programId: input.programId,
        scheduleId: row.scheduleId,
        participantId: row.participantId,
        payload,
      })
    },
    [attendanceMutation, input.programId]
  )

  const changeScheduleRole = useCallback(
    (row: UjatVolunteerAssignmentProgressRow, nextRole: UjatVolunteerScheduleRole) => {
      if (row.scheduleId == null || row.participantId == null) {
        throw new Error('MISSING_ROLE_TARGET')
      }
      return roleMutation.mutateAsync({
        programId: input.programId,
        scheduleId: row.scheduleId,
        participantId: row.participantId,
        role: nextRole,
      })
    },
    [input.programId, roleMutation]
  )

  const data = progressQuery.data

  return {
    bundle: data?.bundle ?? UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE,
    assignOptionsByRowId: data?.assignOptionsByRowId ?? {},
    isLoading: enabled && progressQuery.isLoading,
    isError: enabled && progressQuery.isError,
    isParticipantUnresolved:
      remoteEnabled &&
      !progressQuery.isLoading &&
      !progressQuery.isError &&
      (!enabled || data?.participantId == null),
    isMutating:
      cancelMutation.isPending ||
      confirmMutation.isPending ||
      attendanceMutation.isPending ||
      roleMutation.isPending,
    cancelAssignment,
    confirmAssignment,
    correctAttendance,
    changeScheduleRole,
  }
}
