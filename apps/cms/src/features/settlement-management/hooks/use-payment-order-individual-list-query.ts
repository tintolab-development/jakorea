import { useQuery } from '@tanstack/react-query'
import {
  fetchIndividualSettlementReviewListRemote,
  isIndividualSettlementReviewRemoteEnabled,
} from '@/features/program/general/api/individual-settlement-review-remote'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { mapPaymentOrderIndividualRows } from '@/features/settlement-management/lib/map-payment-order-individual-rows'

export function usePaymentOrderIndividualListQuery(enabled = true) {
  const remoteEnabled = isIndividualSettlementReviewRemoteEnabled()
  return useQuery({
    queryKey: settlementQueryKeys.individualSettlementReviews.list('payment-orders'),
    queryFn: async () => {
      const items = await fetchIndividualSettlementReviewListRemote({ page: 0, size: 100 })
      return mapPaymentOrderIndividualRows(items)
    },
    enabled: enabled && remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
