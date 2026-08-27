/**
 * 산출 내역서 — 「신청 반려」 시 노출되는 지급 반려 모달 (프로그램·강사 상세 공통)
 */

import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import type {
  PaymentOrderRejectNotificationType,
  PaymentOrderRejectSubmitPayload,
} from '@/features/settlement/lib/payment-order-reject-notification'
import './payment-order-payment-rejection-modal.css'

export type { PaymentOrderRejectNotificationType, PaymentOrderRejectSubmitPayload }

export interface PaymentOrderPaymentRejectionModalProps {
  open: boolean
  onCancel: () => void
  onReject: (payload: PaymentOrderRejectSubmitPayload) => void
  data: PaymentOrderProgramCalculationStatement | null
  confirmLoading?: boolean
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
  confirmLoading = false,
}: PaymentOrderPaymentRejectionModalProps) {
  const block0 = data?.blocks[0]
  const instructorName = data ? getInstructorName(data) : ''
  const [reason, setReason] = useState('')
  const [notificationType, setNotificationType] =
    useState<PaymentOrderRejectNotificationType>('IMMEDIATE')
  const [scheduledAt, setScheduledAt] = useState<Dayjs>(() => dayjs().add(1, 'day').hour(9).minute(15).second(0))

  useEffect(() => {
    if (open) {
      setReason('')
      setNotificationType('IMMEDIATE')
      setScheduledAt(dayjs().add(1, 'day').hour(9).minute(15).second(0))
    }
  }, [open])

  const canShow = Boolean(open && data && block0)
  const trimmed = reason.trim()
  const canReject =
    trimmed.length > 0 &&
    !confirmLoading &&
    (notificationType !== 'MANUAL' || scheduledAt?.isValid())

  return (
    <ContentModal
      open={canShow}
      onCancel={confirmLoading ? () => undefined : onCancel}
      title="지급 반려"
      width={600}
      className="payment-order-payment-reject-modal"
      footer={
        <div className="payment-order-payment-reject__footer-actions">
          <CmsButton variant="secondary" size="medium" onClick={onCancel} disabled={confirmLoading}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="medium"
            loading={confirmLoading}
            disabled={!canReject}
            onClick={() => {
              if (!canReject) return
              onReject({
                reason: trimmed,
                notificationType,
                scheduledNotificationAt:
                  notificationType === 'MANUAL' ? scheduledAt.format('YYYY-MM-DDTHH:mm:ss') : undefined,
              })
            }}
          >
            반려
          </CmsButton>
        </div>
      }
    >
      {block0 ? (
        <div className="payment-order-payment-reject">
          <p className="payment-order-payment-reject__line">
            아래 항목에 대한{' '}
            <strong className="payment-order-payment-reject__name">{instructorName}</strong>
            님의 강의비 지급 요청을 반려하시겠습니까?
            <br />
            반려 시 사유를 입력하여 주세요.
          </p>

          <div
            className="payment-order-payment-reject__detail-line"
            aria-label="참여 기관·강의일·회차"
          >
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
            <CmsTextArea
              value={reason}
              className="payment-order-payment-reject__reason-input"
              onChange={e => setReason(e.target.value)}
              placeholder="반려 사유를 입력해 주세요."
              inputSize="medium"
              rows={1}
              maxLength={100}
              disabled={confirmLoading}
            />
          </div>
          <div className="payment-order-payment-reject__notify-block">
            <span className="payment-order-payment-reject__reason-label">알림 발송</span>
            <CmsRadio.Group
              size="large"
              value={notificationType}
              onChange={e =>
                setNotificationType(e.target.value as PaymentOrderRejectNotificationType)
              }
              disabled={confirmLoading}
            >
              <CmsRadio value="IMMEDIATE">즉시</CmsRadio>
              <CmsRadio value="ON_ANNOUNCEMENT">발표일에 맞춰서</CmsRadio>
              <CmsRadio value="MANUAL">직접 설정</CmsRadio>
            </CmsRadio.Group>
            {notificationType === 'MANUAL' ? (
              <DatePicker
                className="payment-order-payment-reject__datetime-picker"
                showTime={{ format: 'HH:mm' }}
                value={scheduledAt}
                onChange={d => d && setScheduledAt(d)}
                format="YYYY. MM. DD HH:mm"
                suffixIcon={<CalendarOutlined />}
                allowClear={false}
                inputReadOnly
                popupStyle={{ zIndex: 1200 }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
