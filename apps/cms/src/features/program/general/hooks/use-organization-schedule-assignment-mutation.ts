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
