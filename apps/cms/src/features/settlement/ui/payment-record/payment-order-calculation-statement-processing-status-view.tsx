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
  correctionReason?: string
  lectureFeePaymentScheduledDateDisplay?: string
}

/** 지급 정정 요청 — 처리 현황 오른쪽에 「정정 요청 사유」 필드를 노출하는 상태 */
export function isPaymentOrderCorrectionRequestedStatus(
  status: PaymentOrderAdminLineProcessingStatus
): boolean {
  return status === 'correction'
}

/** 확인 완료·계좌 지급 대기 — 「이체 예정일」을 노출하는 상태 */
export function isPaymentOrderTransferScheduledStatus(
  status: PaymentOrderAdminLineProcessingStatus
): boolean {
  return status === 'confirmed' || status === 'awaiting_payment'
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
  separateTransferScheduledDate = false,
}: {
  basic: PaymentOrderCalculationStatementProcessingStatusFields
  onResendNotificationClick?: () => void
  /**
   * true면 「이체 예정일」을 상태 셀에 붙이지 않는다 — 호출부가 별도 필드(시안: 처리 현황 | 이체 예정일)로 그린다.
   */
  separateTransferScheduledDate?: boolean
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
    !separateTransferScheduledDate &&
    isPaymentOrderTransferScheduledStatus(basic.processingStatusClass)
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
