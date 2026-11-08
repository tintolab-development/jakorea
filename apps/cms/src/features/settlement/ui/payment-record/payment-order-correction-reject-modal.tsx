/**
 * 산출 내역서 — 지급 정정 요청 상태의 「신청 반려」 = 정정 요청 반려 사유 입력
 * BE `PATCH …/correction-requests/{id}/reject` reason 2~500자.
 */

import { useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import './payment-order-payment-correction-modal.css'

const REASON_MIN_LENGTH = 2
const REASON_MAX_LENGTH = 500

export interface PaymentOrderCorrectionRejectModalProps {
  open: boolean
  confirmLoading?: boolean
  zIndex?: number
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function PaymentOrderCorrectionRejectModal({
  open,
  confirmLoading = false,
  zIndex,
  onCancel,
  onConfirm,
}: PaymentOrderCorrectionRejectModalProps) {
  const [reason, setReason] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- 열 때마다 사유 초기화 */
  useEffect(() => {
    if (open) setReason('')
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = reason.trim()
  const canConfirm = trimmed.length >= REASON_MIN_LENGTH && !confirmLoading

  return (
    <ContentModal
      open={open}
      onCancel={() => {
        if (!confirmLoading) onCancel()
      }}
      title="지급 정정 요청 반려"
      width={600}
      zIndex={zIndex}
      className="payment-order-payment-correction-modal"
      footer={
        <div className="payment-order-payment-correction__footer-actions">
          <CmsButton variant="secondary" size="h40" disabled={confirmLoading} onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            loading={confirmLoading}
            disabled={!canConfirm}
            onClick={() => onConfirm(trimmed)}
          >
            반려
          </CmsButton>
        </div>
      }
    >
      <p className="payment-order-payment-correction__line">
        지급 정정 요청을 반려합니다. 지급조서는 정정 요청 전 상태로 돌아갑니다.
      </p>
      <div className="payment-order-payment-correction__field">
        <span className="payment-order-payment-correction__label">
          반려 사유
          <span className="payment-order-payment-correction__required" aria-hidden>
            *
          </span>
        </span>
        <CmsInput
          value={reason}
          width="100%"
          inputSize="medium"
          placeholder="반려 사유를 입력해 주세요"
          maxLength={REASON_MAX_LENGTH}
          disabled={confirmLoading}
          onChange={e => setReason(e.target.value)}
        />
      </div>
    </ContentModal>
  )
}
