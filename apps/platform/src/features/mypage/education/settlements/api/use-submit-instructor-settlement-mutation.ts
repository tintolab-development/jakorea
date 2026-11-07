import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type {
  InstructorSettlementCreateRequest,
  InstructorSettlementResubmitRequest,
} from '../lib/build-instructor-settlement-submit.ts'
import {
  createInstructorSettlementApplication,
  resubmitInstructorSettlementApplication,
} from './instructor-settlement-client.ts'

export function useSubmitInstructorSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      settlementApplicationId?: number
      create?: InstructorSettlementCreateRequest
      resubmit?: InstructorSettlementResubmitRequest
    }) => {
      if (input.resubmit && input.settlementApplicationId != null) {
        return resubmitInstructorSettlementApplication(input.settlementApplicationId, input.resubmit)
      }
      if (input.create) {
        return createInstructorSettlementApplication(input.create)
      }
      throw new Error('SETTLEMENT_SUBMIT_BODY_REQUIRED')
    },
    retry: false,
    onSuccess: created => {
      if (created.applicationId != null) {
        queryClient.setQueryData(
          platformQueryKeys.mypage.settlementApplication(created.applicationId),
          created,
        )
      }
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.settlementApplications(),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
      void queryClient.invalidateQueries({
        queryKey: [...platformQueryKeys.mypage.all(), 'lecture-report-assignments'],
      })
    },
  })
}
