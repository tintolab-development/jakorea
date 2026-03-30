/**
 * 산출 내역서 — 「신청 반려」 시 노출되는 지급 반려 모달 (프로그램·강사 상세 공통)
 */

import { useEffect, useState } from 'react'
import { Input, message } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import './payment-order-payment-rejection-modal.css'

export interface PaymentOrderPaymentRejectionModalProps {
  open: boolean
  onCancel: () => void
  onReject: (reason: string) => void
  data: PaymentOrderProgramCalculationStatement | null
}

function getInstructorName(statement: PaymentOrderProgramCalculationStatement): string {
  if (statement.context === 'instructor') return statement.basic.nameKo
  return statement.basic.instructorNameKo
}

export function PaymentOrderPaymentRejectionModal({
  open,
  onCancel,
  onReject,
  data,
}: PaymentOrderPaymentRejectionModalProps) {
  const block0 = data?.blocks[0]
  const instructorName = data ? getInstructorName(data) : ''
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

  const canShow = Boolean(open && data && block0)

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title="지급 반려"
      width={600}
      className="payment-order-payment-reject-modal"
      footer={
        <div className="payment-order-payment-reject__footer-actions">
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton
            variant="danger"
            size="large"
            onClick={() => {
              const trimmed = reason.trim()
              if (!trimmed) {
                message.warning('반려 사유를 입력해 주세요.')
                return
              }
              onReject(trimmed)
            }}
          >
            반려
          </AppButton>
        </div>
      }
    >
      {block0 ? (
        <div className="payment-order-payment-reject">
          <p className="payment-order-payment-reject__line">
            아래 항목에 대한 <strong className="payment-order-payment-reject__name">{instructorName}</strong>
            님의 강의비 지급 요청을 반려하시겠습니까?
          </p>
          <p className="payment-order-payment-reject__line">반려 시 사유를 입력하여 주세요.</p>
          <div className="payment-order-payment-reject__detail-line" aria-label="참여 기관·강의일·회차">
            <span>{block0.institutionName}</span>
            <span className="payment-order-payment-reject__sep" aria-hidden>
              |
            </span>
            <span>{block0.lectureDateDisplay}</span>
            <span className="payment-order-payment-reject__sep" aria-hidden>
              |
            </span>
            <span>{block0.lectureSessionDisplay}</span>
          </div>
          <div className="payment-order-payment-reject__reason-block">
            <span className="payment-order-payment-reject__reason-label">반려 사유</span>
            <Input
              className="payment-order-payment-reject__reason-input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="반려 사유를 입력해 주세요."
              maxLength={100}
            />
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
