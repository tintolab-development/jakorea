/**
 * 지급 현황 상세 — 「지급조서 일괄 확인」 ContentModal
 */

import { useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import { isBeforeSeoulToday } from '@/shared/utils/date'
import { defaultLectureFeePaymentScheduledDate } from '@/features/settlement/lib/third-tuesday-of-month'
import './payment-order-batch-confirm-modal.css'

export interface PaymentOrderBatchConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 선택한 신청자 중 첫 번째 이름 — 「[이름] 님 외 N명」 */
  leadApplicantName: string
  /** 첫 신청자를 제외한 나머지 신청자 수 (0이면 「외 N명」 생략) */
  otherApplicantCount: number
  /** 계좌 지급 예정일 초기값 */
  initialScheduledDate?: Dayjs
  /** 확인 완료 (추후 API 연동) */
  onConfirm?: (scheduledDate: Dayjs) => void
}

export function PaymentOrderBatchConfirmModal({
  open,
  onCancel,
  leadApplicantName,
  otherApplicantCount,
  initialScheduledDate,
  onConfirm,
}: PaymentOrderBatchConfirmModalProps) {
  const fallbackDate = defaultLectureFeePaymentScheduledDate()
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(
    initialScheduledDate ?? fallbackDate
  )

  useEffect(() => {
    if (open) {
      setScheduledDate(initialScheduledDate ?? defaultLectureFeePaymentScheduledDate())
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
      title="지급조서 일괄 확인 안내"
      width={600}
      className="payment-order-batch-confirm-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="h40" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="h40" onClick={handleConfirm}>
            확인 완료
          </CmsButton>
        </>
      }
    >
      <div className="payment-order-batch-confirm-modal__inner">
        <p className="payment-order-batch-confirm-modal__lead">
          <strong>
            [{leadApplicantName}] 님{otherApplicantCount > 0 ? ` 외 ${otherApplicantCount}명` : ''}
          </strong>
          의 강사비 지급조서 신청을 일괄 확인 처리하시겠습니까?
          <br />
          정산된 금액은 <strong>매월 셋째 주 화요일에 계좌 지급</strong>
          됩니다.
        </p>
        <div className="payment-order-batch-confirm-modal__field">
          <span className="payment-order-batch-confirm-modal__label">
            계좌 지급 예정일
            <span className="cms-field__required" aria-hidden>
              *
            </span>
          </span>
          <CmsDatePicker
            className="payment-order-batch-confirm-modal__datepicker"
            value={scheduledDate}
            onChange={d => setScheduledDate(d)}
            disabledDate={current => isBeforeSeoulToday(current)}
            inputSize="medium"
            allowClear={false}
          />
        </div>
      </div>
    </ContentModal>
  )
}
