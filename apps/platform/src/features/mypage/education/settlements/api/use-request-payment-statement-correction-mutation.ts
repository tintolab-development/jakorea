import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { readInstructorSettlementErrorCode } from '../lib/instructor-settlement-contract.ts'
import { requestPaymentStatementCorrection } from './instructor-settlement-client.ts'

const REFRESH_ON_ERROR_CODES = new Set([
  'PAYMENT_STATEMENT_STATUS_CONFLICT',
  'SETTLEMENT_CORRECTION_ALREADY_REQUESTED',
  'GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED',
])

/** 확인 완료 지급조서 정정 요청. 성공하면 목록이 "지급 정정 요청"으로 바뀐다. */
export function useRequestPaymentStatementCorrectionMutation() {
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.settlementApplications(),
    })
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.all(),
    })
  }
  return useMutation({
    mutationFn: (input: { settlementId: number; reason: string }) =>
      requestPaymentStatementCorrection(input.settlementId, input.reason),
    retry: false,
    onSuccess: refresh,
    onError: error => {
      const code = readInstructorSettlementErrorCode(error)
      if (code && REFRESH_ON_ERROR_CODES.has(code)) refresh()
    },
  })
}
