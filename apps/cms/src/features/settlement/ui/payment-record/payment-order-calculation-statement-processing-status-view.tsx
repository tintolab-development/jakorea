/**
 * 산출 내역서 — 지급조서 처리 현황 표시 (프로그램·신청자 basic 공통)
 */

import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'
import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import { StatusBadge } from '@/shared/components/status-badge'
import { PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR } from '@/shared/constants/payment-order-status-list-colors'

export type PaymentOrderCalculationStatementProcessingStatusFields = {
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  processingRejectionReason?: string
  lectureFeePaymentScheduledDateDisplay?: string
}

function ProcessingStatusText({
  status,
  label,
}: {
  status: PaymentOrderAdminLineProcessingStatus
  label: string
}) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="payment-order-admin__status-text"
      label={label}
      accentColor={PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[status]}
    />
  )
}

function ResendSlot({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null
  return (
    <>
      <ProgramDetailTdDivider />
      <SendNotiButton mode="resend" onClick={onClick} />
    </>
  )
}

export function PaymentOrderCalculationStatementProcessingStatusView({
  basic,
  onResendNotificationClick,
}: {
  basic: PaymentOrderCalculationStatementProcessingStatusFields
  onResendNotificationClick?: () => void
}) {
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
          <ProcessingStatusText status="rejected" label={basic.processingStatusDisplay} />
        )}
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          사유 : {basic.processingRejectionReason ?? '-'}
        </span>
        <ResendSlot onClick={onResendNotificationClick} />
      </div>
    )
  }

  if (
    basic.processingStatusClass === 'confirmed' ||
    basic.processingStatusClass === 'awaiting_payment'
  ) {
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        <ProcessingStatusText
          status={basic.processingStatusClass}
          label={basic.processingStatusDisplay}
        />
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          이체 예정일 : {basic.lectureFeePaymentScheduledDateDisplay ?? '-'}
        </span>
        <ResendSlot onClick={onResendNotificationClick} />
      </div>
    )
  }

  if (onResendNotificationClick) {
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        <ProcessingStatusText
          status={basic.processingStatusClass}
          label={basic.processingStatusDisplay}
        />
        <ResendSlot onClick={onResendNotificationClick} />
      </div>
    )
  }

  return (
    <ProcessingStatusText
      status={basic.processingStatusClass}
      label={basic.processingStatusDisplay}
    />
  )
}
