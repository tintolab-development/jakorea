import { useMutation, useQueryClient } from '@tanstack/react-query'
import { replaceOrganizationScheduleAssignmentsRemote } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { organizationScheduleAssignmentsQueryKey } from '@/features/program/general/lib/organization-education-schedule-sources'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  slotsFromScheduleIds,
  validateOrganizationScheduleAssignmentReplace,
} from '@/features/program/general/lib/organization-schedule-assignment-save'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export type ReplaceOrganizationScheduleAssignmentInput = {
  selectedScheduleIds: number[]
  allowedScheduleIds: number[]
  changeReason?: string
}

export function useOrganizationScheduleAssignmentMutation(
  programId: string,
  organizationApplicationId: string
) {
  const queryClient = useQueryClient()
  const trimmedProgramId = programId.trim()
  const trimmedApplicationId = organizationApplicationId.trim()

  return useMutation({
    mutationFn: async (input: ReplaceOrganizationScheduleAssignmentInput) => {
      const validation = validateOrganizationScheduleAssignmentReplace({
        selectedScheduleIds: input.selectedScheduleIds,
        allowedScheduleIds: input.allowedScheduleIds,
      })
      if (!validation.ok) {
        throw new Error(validation.message)
      }
      return replaceOrganizationScheduleAssignmentsRemote(
        trimmedProgramId,
        trimmedApplicationId,
        {
          slots: slotsFromScheduleIds(validation.scheduleIds),
          changeReason: input.changeReason?.trim() || 'CMS 기관 교육 일정 배정',
        }
      )
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationScheduleAssignmentsQueryKey(
            trimmedProgramId,
            trimmedApplicationId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationList(trimmedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationDetailInProgram(
            trimmedProgramId,
            trimmedApplicationId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.schedules(trimmedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.educationSlots(trimmedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.all,
        }),
      ])
    },
    onError: async (error: unknown) => {
      await queryClient.invalidateQueries({
        queryKey: organizationScheduleAssignmentsQueryKey(
          trimmedProgramId,
          trimmedApplicationId
        ),
      })
      const message = getGeneralProgramApiErrorMessage(
        error,
        error instanceof Error ? error.message : '교육 일정 배정 저장에 실패했습니다.'
      )
      cmsAlertModal.show({ title: '교육 일정 배정', content: message })
    },
  })
}

export type ConfirmOrganizationRequestedSchedulesInput = {
  requestedScheduleIds: number[]
  changeReason?: string
}

/**
 * 일반 기관 · 기간 지정 — 승인 후 희망 일정 확정.
 * PUT schedule-assignments { requestedScheduleIds } (slots와 동시 전송 금지).
 * 성공 후 희망 일정(resolvedScheduleId)·기관 일정 배정·강사 배정 보드를 다시 불러온다.
 */
export function useOrganizationRequestedScheduleConfirmMutation(
  programId: string,
  organizationApplicationId: string,
  options?: { onSettledRefresh?: () => Promise<void> | void }
) {
  const queryClient = useQueryClient()
  const trimmedProgramId = programId.trim()
  const trimmedApplicationId = organizationApplicationId.trim()

  return useMutation({
    mutationFn: async (input: ConfirmOrganizationRequestedSchedulesInput) => {
      const ids = [...new Set(input.requestedScheduleIds.filter(id => Number.isInteger(id) && id > 0))]
      if (ids.length === 0) throw new Error('확정할 희망 일정을 선택해 주세요.')
      return replaceOrganizationScheduleAssignmentsRemote(trimmedProgramId, trimmedApplicationId, {
        requestedScheduleIds: ids,
        changeReason: input.changeReason?.trim() || '승인 후 희망 일정 확정',
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationRequestedSchedules(trimmedApplicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationScheduleAssignmentsQueryKey(trimmedProgramId, trimmedApplicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationList(trimmedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationDetailInProgram(
            trimmedProgramId,
            trimmedApplicationId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.schedules(trimmedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.all,
        }),
      ])
      await options?.onSettledRefresh?.()
    },
    onError: async (error: unknown) => {
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.organizationRequestedSchedules(trimmedApplicationId),
      })
      const message = getGeneralProgramApiErrorMessage(
        error,
        error instanceof Error ? error.message : '희망 일정 확정에 실패했습니다.'
      )
      cmsAlertModal.show({ title: '희망 일정 확정', content: message })
    },
  })
}
