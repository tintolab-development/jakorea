import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { fetchPaymentStatementCorrectionDetail } from './instructor-settlement-client.ts'

/** 정정 내역 확인 팝업을 열 때만 조회한다. */
export function usePaymentStatementCorrectionQuery(settlementId: number | null | undefined, open: boolean) {
  const enabled =
    open && settlementId != null && Number.isSafeInteger(settlementId) && settlementId > 0
  return useQuery({
    queryKey: platformQueryKeys.mypage.paymentStatementCorrection(settlementId ?? 0),
    queryFn: ({ signal }) => fetchPaymentStatementCorrectionDetail(settlementId!, signal),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
