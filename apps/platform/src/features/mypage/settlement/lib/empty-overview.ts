import type { SettlementOverviewPageData } from '../model/types.ts'

export const EMPTY_SETTLEMENT_OVERVIEW: SettlementOverviewPageData = {
  items: [],
  summary: {
    totalPaidAmount: null,
    monthPaidAmount: null,
    monthExpectedAmount: null,
  },
}
