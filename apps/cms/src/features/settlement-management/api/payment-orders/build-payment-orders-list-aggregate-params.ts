import type { PaymentOrderAdminProcessingStatus } from '@/data/mock/payment-order-admin-list'
import type {
  ListSettlementAggregatesParams,
  ListSettlementAggregatesStatementStatus,
} from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrdersPendingFilters } from '@/pages/settlement-management/payment-orders-table.config'
import { mapPendingItemBucketToApi } from '@/pages/settlement-management/payment-orders-pending-item-bucket'

export type PaymentOrdersListFilterInput = Pick<
  PaymentOrdersPendingFilters,
  'programName' | 'instructorName' | 'processingStatus' | 'pendingItemBucket' | 'dateRange'
> & {
  viewMode?: 'list' | 'calendar'
}

function mapUiProcessingStatusToStatementStatus(
  status: PaymentOrderAdminProcessingStatus
): ListSettlementAggregatesStatementStatus {
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED'
    case 'correction':
      return 'CORRECTION_REQUESTED'
    case 'application_rejected':
      return 'REJECTED'
    case 'reapplication':
      return 'REAPPLICATION'
    case 'partial':
      return 'PARTIAL'
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

  const viewMode = filters.viewMode ?? 'list'
  if (viewMode === 'calendar' && filters.processingStatus !== 'all') {
    params.statementStatus = mapUiProcessingStatusToStatementStatus(filters.processingStatus)
  }
  if (viewMode === 'list' && filters.pendingItemBucket !== 'all') {
    params.pendingItemBucket = mapPendingItemBucketToApi(filters.pendingItemBucket)
  }

  if (filters.dateRange?.[0] && filters.dateRange[1]) {
    params.fromDate = filters.dateRange[0].format('YYYY-MM-DD')
    params.toDate = filters.dateRange[1].format('YYYY-MM-DD')
  }

  return params
}

