/**
 * 계좌 지급 현황 Text — 목록·상세 기본 정보 공통 (StatusBadge text + ACCOUNT_PAYMENT_AGGREGATE_TEXT_COLOR)
 */

import { StatusBadge } from '@/shared/components/status-badge'
import {
  ACCOUNT_PAYMENT_AGGREGATE_TEXT_COLOR,
  type AccountPaymentAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'

export function AccountPaymentStatusText({
  status,
  label,
}: {
  status: AccountPaymentAggregateStatus
  label: string
}) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      label={label}
      accentColor={ACCOUNT_PAYMENT_AGGREGATE_TEXT_COLOR[status] ?? 'var(--Netural-black, #3d3d3d)'}
    />
  )
}
