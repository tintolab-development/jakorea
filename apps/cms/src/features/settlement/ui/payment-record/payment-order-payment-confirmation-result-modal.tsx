import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'

export interface PaymentOrderPaymentConfirmationResultModalProps {
  open: boolean
  onClose: () => void
}

export function PaymentOrderPaymentConfirmationResultModal({
  open,
  onClose,
}: PaymentOrderPaymentConfirmationResultModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="지급조서 확인 완료"
      width={520}
      footer={
        <div className="payment-order-payment-confirm-result__footer-actions">
          <CmsButton variant="secondary" size="medium" onClick={onClose}>
            닫기
          </CmsButton>
        </div>
      }
    >
      <span className="fs-16">지급조서 확인 처리가 완료 되었습니다.</span>
    </ContentModal>
  )
}
