/**
 * 산출 내역서 — 반려 완료 결과 모달
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import './payment-order-payment-rejection-result-modal.css'

export interface PaymentOrderPaymentRejectionResultModalProps {
  open: boolean
  onClose: () => void
  data: PaymentOrderProgramCalculationStatement | null
  reason: string
}

function getInstructorName(statement: PaymentOrderProgramCalculationStatement): string {
  if (statement.context === 'instructor') return statement.basic.nameKo
  return statement.basic.instructorNameKo
}

export function PaymentOrderPaymentRejectionResultModal({
  open,
  onClose,
  data,
  reason,
}: PaymentOrderPaymentRejectionResultModalProps) {
  const canShow = Boolean(open && data)
  if (!data) return null

  const instructorName = getInstructorName(data)

  return (
    <ContentModal
      open={canShow}
      onCancel={onClose}
      title="지급 반려"
      width={600}
      className="payment-order-payment-reject-result-modal"
      footer={
        <div className="payment-order-payment-reject-result__footer-actions">
          <CmsButton variant="secondary" size="large" onClick={onClose}>
            확인
          </CmsButton>
        </div>
      }
    >
      <p className="payment-order-payment-reject-result__line">
        <strong className="payment-order-payment-reject-result__name">[{instructorName}]</strong>{' '}
        님의 강의비 지급 요청이 반려되었습니다.
        <br />
        (사유 : {reason || '-'})
      </p>
    </ContentModal>
  )
}
