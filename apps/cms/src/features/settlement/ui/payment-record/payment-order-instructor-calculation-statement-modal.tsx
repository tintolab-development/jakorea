/**
 * 산출 내역서 모달 — 신청자형 기본정보 (신청자별 정산 목록에서 연 때)
 */

import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import { PaymentOrderCalculationStatementModalImpl } from './payment-order-calculation-statement-modal-impl'

export interface PaymentOrderInstructorCalculationStatementModalProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
  loading?: boolean
  loadError?: unknown
  paymentOrdersRemote?: boolean
  statementId?: number | null
  detailContextQuery?: import('@/features/settlement-management/hooks/use-payment-orders-detail-query').PaymentOrdersDetailContextQueryResult
  onStatementLineCommitted?: (payload: PaymentOrderCalculationStatementCommitPayload) => void
  onAfterRejectResultClosed?: () => void
}

export function PaymentOrderInstructorCalculationStatementModal(
  props: PaymentOrderInstructorCalculationStatementModalProps
) {
  return (
    <PaymentOrderCalculationStatementModalImpl
      {...props}
      entryKind="instructor"
      entryClassName="payment-order-calc-statement-modal--entry-instructor"
    />
  )
}
