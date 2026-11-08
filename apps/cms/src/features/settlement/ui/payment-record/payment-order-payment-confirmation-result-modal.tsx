/**
 * 지급조서 확인·정정 완료 결과 모달 (단건·일괄·정정 공통)
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './payment-order-payment-confirmation-result-modal.css'

export interface PaymentOrderPaymentConfirmationResultModalProps {
  open: boolean
  onClose: () => void
  zIndex?: number
  /** 기본: 지급조서 확인 완료 */
  title?: string
  message?: string
}

export function PaymentOrderPaymentConfirmationResultModal({
  open,
  onClose,
  zIndex,
  title = '지급조서 확인 완료',
  message = '지급조서 확인이 완료되었습니다.',
}: PaymentOrderPaymentConfirmationResultModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={600}
      zIndex={zIndex}
      className="payment-order-payment-confirm-result-modal"
      footer={
        <div className="payment-order-payment-confirm-result__footer-actions">
          <CmsButton variant="secondary" size="h40" onClick={onClose}>
            확인
          </CmsButton>
        </div>
      }
    >
      <p className="payment-order-payment-confirm-result__line">{message}</p>
    </ContentModal>
  )
}
