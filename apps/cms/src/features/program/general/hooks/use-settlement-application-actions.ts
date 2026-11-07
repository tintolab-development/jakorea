import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  confirmSettlementApplicationRemote,
  rejectSettlementApplicationRemote,
  requestSettlementApplicationCorrectionRemote,
  type SettlementApplicationActionKind,
} from '@/features/program/general/api/settlement-application-actions-remote'
import { participatingInstructorSettlementsQueryOptions } from '@/features/program/general/api/participating-instructor-settlements-remote'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

export type SettlementApplicationActionInput = {
  kind: SettlementApplicationActionKind
  /** 정산 목록 행의 settlementApplicationId */
  settlementApplicationId: number
  reason?: string
}

async function runSettlementApplicationAction(input: SettlementApplicationActionInput) {
  const reason = input.reason?.trim()
  switch (input.kind) {
    case 'confirm':
      return confirmSettlementApplicationRemote(
        input.settlementApplicationId,
        reason ? { reason } : {}
      )
    case 'reject':
      return rejectSettlementApplicationRemote(input.settlementApplicationId, {
        reason: reason ?? '',
      })
    case 'requestCorrection':
      return requestSettlementApplicationCorrectionRemote(input.settlementApplicationId, {
        reason: reason ?? '',
      })
  }
}

/**
 * 참여 강사 정산 현황 — 확정 전 신청서 승인·반려·보정 요청.
 * 성공 또는 409(상태 충돌) 후 `GET /api/admin/settlements?programId&instructorMemberId`를 다시 읽는다.
 */
export function useSettlementApplicationActions(input: {
  programId: string
  instructorMemberId: string
}) {
  const queryClient = useQueryClient()

  const refetchSettlements = () =>
    queryClient.invalidateQueries({
      queryKey: participatingInstructorSettlementsQueryOptions({
        programId: input.programId,
        instructorMemberId: input.instructorMemberId,
      }).queryKey,
    })

  return useMutation({
    mutationFn: runSettlementApplicationAction,
    onSuccess: refetchSettlements,
    onError: async error => {
      if (getApiErrorHttpStatus(error) === 409) await refetchSettlements()
    },
  })
}
