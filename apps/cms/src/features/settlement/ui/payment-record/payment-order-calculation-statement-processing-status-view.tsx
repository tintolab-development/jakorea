/**
 * 산출 내역서 — 지급조서 처리 현황 표시 (프로그램·신청자 basic 공통)
 */

import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

export type PaymentOrderCalculationStatementProcessingStatusFields = {
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  processingRejectionReason?: string
  lectureFeePaymentScheduledDateDisplay?: string
}

function processingStatusCssModifier(status: PaymentOrderAdminLineProcessingStatus): string {
  return status === 'application_rejected' ? 'application-rejected' : status
}

function sendNotiPlaceholder() {
  window.alert('준비중')
}

export function PaymentOrderCalculationStatementProcessingStatusView({
  basic,
}: {
  basic: PaymentOrderCalculationStatementProcessingStatusFields
}) {
  const statusMod = processingStatusCssModifier(basic.processingStatusClass)

  if (
    basic.processingStatusClass === 'application_rejected' ||
    basic.processingStatusClass === 'rejected'
  ) {
    const isApplicationRejected = basic.processingStatusClass === 'application_rejected'
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        {isApplicationRejected ? (
          <span className="payment-order-calc-statement-modal__processing-status-label--application-rejected">
            신청 반려
          </span>
        ) : (
          <span className="payment-order-admin__status-text payment-order-admin__status-text--rejected">
            {basic.processingStatusDisplay}
          </span>
        )}
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          사유 : {basic.processingRejectionReason ?? '-'}
        </span>
        <ProgramDetailTdDivider />
        <SendNotiButton onClick={sendNotiPlaceholder} />
      </div>
    )
  }

  if (basic.processingStatusClass === 'confirmed') {
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        <span className="payment-order-admin__status-text payment-order-admin__status-text--confirmed">
          {basic.processingStatusDisplay}
        </span>
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          이체 예정일 : {basic.lectureFeePaymentScheduledDateDisplay ?? '-'}
        </span>
      </div>
    )
  }

  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${statusMod}`}
    >
      {basic.processingStatusDisplay}
    </span>
  )
}
