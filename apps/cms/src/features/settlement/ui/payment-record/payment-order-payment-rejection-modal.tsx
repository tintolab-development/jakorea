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

function getMemberName(statement: PaymentOrderProgramCalculationStatement): string {
  if (statement.context === 'instructor') return statement.basic.nameKo
  return statement.basic.instructorNameKo
}

function getContextLine(statement: PaymentOrderProgramCalculationStatement): {
  first: string
  lectureDateDisplay: string
  lectureSessionDisplay: string
} {
  const block0 = statement.blocks[0]
  const programName = statement.basic.programName?.trim() || ''
  return {
    first: block0?.institutionName?.trim() || programName || '-',
    lectureDateDisplay: block0?.lectureDateDisplay?.trim() || '-',
    lectureSessionDisplay: block0?.lectureSessionDisplay?.trim() || '-',
  }
}

export function PaymentOrderPaymentRejectionModal({
  open,
  onCancel,
  onReject,
  data,
  confirmLoading = false,
}: PaymentOrderPaymentRejectionModalProps) {
  const memberName = data ? getMemberName(data) : ''
  const contextLine = data ? getContextLine(data) : null
  const modalContentRef = useRef<HTMLDivElement>(null)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)

  const [reason, setReason] = useState('')
  /** 시안 3-3-1: 알림 발송 기본 미선택 — 고르기 전에는 반려 불가 */
  const [notificationType, setNotificationType] =
    useState<PaymentOrderRejectNotificationType | null>(null)
  const [scheduledAt, setScheduledAt] = useState<Dayjs>(() => getDefaultManualNotifyAt())
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setNotificationType(null)
      setScheduledAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(false)
    }
  }, [open])

  const canShow = Boolean(open && data && contextLine)
  const trimmed = reason.trim()
  const canReject =
    trimmed.length > 0 &&
    notificationType != null &&
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
        title="지급조서 반려 안내"
        width={600}
        className="payment-order-payment-reject-modal"
        zIndex={REJECT_MODAL_Z}
        footer={
          <div className="payment-order-payment-reject__footer-actions">
            <CmsButton
              variant="secondary"
              size="h40"
              onClick={onCancel}
              disabled={confirmLoading}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="h40"
              loading={confirmLoading}
              disabled={!canReject}
              onClick={() => {
                if (!canReject || notificationType == null) return
                onReject({
                  reason: trimmed,
                  notificationType,
                  scheduledNotificationAt:
                    notificationType === 'MANUAL'
                      ? scheduledAt.format('YYYY-MM-DDTHH:mm:ss')
                      : undefined,
                })
              }}
            >
              반려
            </CmsButton>
          </div>
        }
      >
        {contextLine ? (
          <div ref={modalContentRef} className="payment-order-payment-reject">
            <div className="payment-order-payment-reject__desc">
              <p className="payment-order-payment-reject__line">
                <strong className="payment-order-payment-reject__name">[{memberName}]</strong>{' '}
                님의 지급조서 신청을 반려하시겠습니까?
              </p>
              <p className="payment-order-payment-reject__line">
                반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.
              </p>
            </div>

            <div
              className="payment-order-payment-reject__detail-line"
              aria-label="대상·진행 일자·회차 또는 차시"
            >
              <span>{contextLine.first}</span>
              <span className="payment-order-payment-reject__sep" aria-hidden />
              <span>{contextLine.lectureDateDisplay}</span>
              <span className="payment-order-payment-reject__sep" aria-hidden />
              <span>{contextLine.lectureSessionDisplay}</span>
            </div>
            <div className="payment-order-payment-reject__reason-block">
              <span className="payment-order-payment-reject__reason-label">
                반려 사유
                <span className="payment-order-payment-reject__required" aria-hidden>
                  *
                </span>
              </span>
              <CmsInput
                value={reason}
                width="100%"
                inputSize="medium"
                onChange={e => setReason(e.target.value)}
                placeholder="반려 사유를 입력해 주세요"
                maxLength={100}
                disabled={confirmLoading}
              />
            </div>
            <div className="payment-order-payment-reject__notify-block">
              <span className="payment-order-payment-reject__reason-label">
                알림 발송
                <span className="payment-order-payment-reject__required" aria-hidden>
                  *
                </span>
              </span>
              <CmsRadio.Group
                size="medium"
                value={notificationType ?? undefined}
                onChange={e =>
                  handleNotifyTimingChange(e.target.value as PaymentOrderRejectNotificationType)
                }
                disabled={confirmLoading}
              >
                <CmsRadio value="IMMEDIATE" size="medium">
                  즉시
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
