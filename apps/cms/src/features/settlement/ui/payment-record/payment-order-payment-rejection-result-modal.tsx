/**
 * 산출 내역서 — 반려 완료 결과 모달
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './payment-order-payment-rejection-result-modal.css'

export interface PaymentOrderPaymentRejectionResultModalProps {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function PaymentOrderPaymentRejectionResultModal({
  open,
  onClose,
  zIndex,
}: PaymentOrderPaymentRejectionResultModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="지급조서 반려 완료"
      width={600}
      zIndex={zIndex}
      className="payment-order-payment-reject-result-modal"
      footer={
        <div className="payment-order-payment-reject-result__footer-actions">
          <CmsButton variant="secondary" size="h40" onClick={onClose}>
            확인
          </CmsButton>
        </div>
      }
    >
      <p className="payment-order-payment-reject-result__line">지급조서 반려가 완료되었습니다.</p>
    </ContentModal>
  )
}
