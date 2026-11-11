import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { readInstructorSettlementErrorCode } from '../lib/instructor-settlement-contract.ts'
import { reapplyCorrectedPaymentStatement } from './instructor-settlement-client.ts'

/** 이미 재신청됐거나 기한이 지난 경우 — 목록을 다시 불러와 최신 상태를 보여 준다 */
const REFRESH_ON_ERROR_CODES = new Set([
  'SETTLEMENT_REAPPLICATION_NOT_AVAILABLE',
  'SETTLEMENT_REAPPLICATION_DEADLINE_EXPIRED',
])

/** 정정 승인된 지급조서(DRAFT) 재신청. 성공하면 목록을 다시 불러와 상태가 "지급조서 재신청"으로 바뀐다. */
export function useReapplyPaymentStatementMutation() {
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
    mutationFn: (settlementId: number) => reapplyCorrectedPaymentStatement(settlementId),
    retry: false,
    onSuccess: refresh,
    onError: error => {
      const code = readInstructorSettlementErrorCode(error)
      if (code && REFRESH_ON_ERROR_CODES.has(code)) refresh()
    },
  })
}
