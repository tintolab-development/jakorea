/**
 * 지급 현황 상세 — 「지급조서 일괄 확인」 ContentModal
 */

import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import './payment-order-batch-confirm-modal.css'

const DEFAULT_SCHEDULED_DATE = dayjs('2026-02-17')

export interface PaymentOrderBatchConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 선택된 정산 행 수 */
  selectedCount: number
  /** 강의비 지급 예정일 초기값 */
  initialScheduledDate?: Dayjs
  /** 확인 완료 (추후 API 연동) */
  onConfirm?: (scheduledDate: Dayjs) => void
}

export function PaymentOrderBatchConfirmModal({
  open,
  onCancel,
  selectedCount,
  initialScheduledDate = DEFAULT_SCHEDULED_DATE,
  onConfirm,
}: PaymentOrderBatchConfirmModalProps) {
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(initialScheduledDate)

  useEffect(() => {
    if (open) {
      setScheduledDate(initialScheduledDate ?? DEFAULT_SCHEDULED_DATE)
    }
  }, [open, initialScheduledDate])

  const handleConfirm = () => {
    if (scheduledDate == null || !scheduledDate.isValid()) {
      return
    }
    if (onConfirm) {
      onConfirm(scheduledDate)
    } else {
      console.debug('paymentOrderBatchConfirmModal onConfirm not provided')
    }
    onCancel()
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="지급조서 일괄 확인"
      width={600}
      className="payment-order-batch-confirm-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" width={160} onClick={handleConfirm}>
            지급조서 확인 완료
          </CmsButton>
        </>
      }
    >
      <div className="payment-order-batch-confirm-modal__inner">
        <p className="payment-order-batch-confirm-modal__lead">
          <strong>
            선택한 {selectedCount}개의 항목
          </strong>
          에 대한 강의비 지급 요청을 일괄 확인 처리하시겠습니까?
          <br />
          강의비는{' '}
          <strong>매월 셋째주 화요일에 지급</strong>
          됩니다.
        </p>
        <div className="payment-order-batch-confirm-modal__field">
          <span className="payment-order-batch-confirm-modal__label">강의비 지급 예정일</span>
          <CmsDatePicker
            className="payment-order-batch-confirm-modal__datepicker"
            value={scheduledDate}
            onChange={d => setScheduledDate(d)}
            inputSize="medium"
            allowClear={false}
          />
        </div>
      </div>
    </ContentModal>
  )
}
