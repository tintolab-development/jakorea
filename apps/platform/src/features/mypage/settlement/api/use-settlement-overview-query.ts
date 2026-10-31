import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { EMPTY_SETTLEMENT_OVERVIEW } from '../lib/empty-overview'
import type { SettlementOverviewPageData } from '../model/types'
import { fetchSettlementOverviewPageData } from './client'

/** Class C — 정산현황 overview (강사 settlement-applications + 개인 individual schedules) */
export function useSettlementOverviewQuery(input: {
  enabled: boolean
  month: string
  fixture: boolean
}) {
  return useQuery({
    queryKey: [
      ...platformQueryKeys.mypage.settlementApplications(),
      'overview',
      input.month,
      input.fixture ? 'fixture' : 'remote',
    ] as const,
    enabled: input.enabled && !input.fixture,
    queryFn: ({ signal }) =>
      fetchSettlementOverviewPageData({ month: input.month, signal }),
    staleTime: 60_000,
    placeholderData: EMPTY_SETTLEMENT_OVERVIEW satisfies SettlementOverviewPageData,
  })
}
