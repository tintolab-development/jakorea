/**
 * 산출 내역서 — 「신청 반려」 시 노출되는 지급 반려 모달 (프로그램·강사 상세 공통)
 */

import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import {
  getDefaultManualNotifyAt,
  getMinimumManualNotifyAt,
  isFutureNotificationTime,
} from '@/shared/lib/notification-schedule'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import type {
  PaymentOrderRejectNotificationType,
  PaymentOrderRejectSubmitPayload,
} from '@/features/settlement/lib/payment-order-reject-notification'
import './payment-order-payment-rejection-modal.css'

export type { PaymentOrderRejectNotificationType, PaymentOrderRejectSubmitPayload }

/** 산출 내역서(중첩) 위 — PermissionModal과 동일 스택 */
const REJECT_MODAL_Z = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

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
  const modalContentRef = useRef<HTMLDivElement>(null)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)

  const [reason, setReason] = useState('')
  const [notificationType, setNotificationType] =
    useState<PaymentOrderRejectNotificationType>('IMMEDIATE')
  const [scheduledAt, setScheduledAt] = useState<Dayjs>(() => getDefaultManualNotifyAt())
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setNotificationType('IMMEDIATE')
      setScheduledAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(false)
    }
  }, [open])

  const canShow = Boolean(open && data && block0)
  const trimmed = reason.trim()
  const canReject =
    trimmed.length > 0 &&
    !confirmLoading &&
    (notificationType !== 'MANUAL' || isFutureNotificationTime(scheduledAt))

  const handleNotifyTimingChange = (next: PaymentOrderRejectNotificationType) => {
    setNotificationType(next)
    if (next === 'MANUAL') {
      setScheduledAt(prev => prev ?? getDefaultManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  return (
    <>
      <ContentModal
        open={canShow}
        onCancel={confirmLoading ? () => undefined : onCancel}
        title="지급 반려"
        width={600}
        className="payment-order-payment-reject-modal"
        zIndex={REJECT_MODAL_Z}
        footer={
          <div className="payment-order-payment-reject__footer-actions">
            <CmsButton
              variant="secondary"
              size="medium"
              onClick={onCancel}
              disabled={confirmLoading} >
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
                    notificationType === 'MANUAL'
                      ? scheduledAt.format('YYYY-MM-DDTHH:mm:ss')
                      : undefined,
                })
              }} >
              반려
            </CmsButton>
          </div>
        }
      >
        {block0 ? (
          <div ref={modalContentRef} className="payment-order-payment-reject">
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
              <CmsInput
                value={reason}
                width="100%"
                inputSize="large"
                onChange={e => setReason(e.target.value)}
                placeholder="반려 사유를 입력해 주세요."
                maxLength={100}
                disabled={confirmLoading}
              />
            </div>
            <div className="payment-order-payment-reject__notify-block">
              <span className="payment-order-payment-reject__reason-label">알림 발송</span>
              <CmsRadio.Group
                size="medium"
                value={notificationType}
                onChange={e =>
                  handleNotifyTimingChange(e.target.value as PaymentOrderRejectNotificationType)
                }
                disabled={confirmLoading}
              >
                <CmsRadio value="IMMEDIATE" size="medium">
                  즉시
                </CmsRadio>
                <CmsRadio value="ON_ANNOUNCEMENT" size="medium">
                  발표일에 맞춰서
                </CmsRadio>
                <span
                  ref={manualRadioAnchorRef}
                  className="payment-order-payment-reject__manual-anchor"
                >
                  <CmsRadio
                    value="MANUAL"
                    size="medium"
                    onClick={() => {
                      if (notificationType === 'MANUAL') {
                        setScheduledAt(prev => prev ?? getDefaultManualNotifyAt())
                        setDateTimePickerOpen(true)
                      }
                    }}
                  >
                    직접 설정
                    {notificationType === 'MANUAL' ? (
                      <span className="payment-order-payment-reject__manual-summary">
                        {' '}
                        ({formatYmdHmWithKoreanWeekday(scheduledAt)})
                      </span>
                    ) : null}
                  </CmsRadio>
                </span>
              </CmsRadio.Group>
            </div>
          </div>
        ) : null}
      </ContentModal>
      <DateTimePickerPopover
        open={canShow && notificationType === 'MANUAL' && dateTimePickerOpen}
        onClose={() => setDateTimePickerOpen(false)}
        anchorRef={manualRadioAnchorRef}
        dismissExcludeRef={modalContentRef}
        value={scheduledAt}
        onChange={setScheduledAt}
        onApply={value => {
          setScheduledAt(value)
          setDateTimePickerOpen(false)
        }}
        minDateTime={getMinimumManualNotifyAt()}
        zIndex={REJECT_MODAL_Z + DATE_TIME_PICKER_Z_OFFSET}
      />
    </>
  )
}
