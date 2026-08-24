import type { PaymentOrderAdminProcessingStatus } from '@/data/mock/payment-order-admin-list'
import type { ListSettlementAggregatesParams } from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrdersPendingFilters } from '@/pages/settlement-management/payment-orders-table.config'

export type PaymentOrdersListFilterInput = Pick<
  PaymentOrdersPendingFilters,
  'programName' | 'instructorName' | 'processingStatus' | 'dateRange'
>

function mapUiProcessingStatusToStatementStatus(
  status: PaymentOrderAdminProcessingStatus
): string {
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED'
    case 'correction':
      return 'CORRECTION_REQUESTED'
    case 'application_rejected':
      return 'REJECTED'
    default:
      return 'REQUESTED'
  }
}

export function buildPaymentOrdersListAggregateParams(
  groupBy: 'program' | 'instructor',
  filters: PaymentOrdersListFilterInput
): ListSettlementAggregatesParams {
  const params: ListSettlementAggregatesParams = { groupBy }

  const search =
    groupBy === 'program' ? filters.programName.trim() : filters.instructorName.trim()
  if (search) {
    params.search = search
  }

  if (filters.processingStatus !== 'all') {
    params.statementStatus = mapUiProcessingStatusToStatementStatus(filters.processingStatus)
  }

  if (filters.dateRange?.[0] && filters.dateRange[1]) {
    params.fromDate = filters.dateRange[0].format('YYYY-MM-DD')
    params.toDate = filters.dateRange[1].format('YYYY-MM-DD')
  }

  return params
}
