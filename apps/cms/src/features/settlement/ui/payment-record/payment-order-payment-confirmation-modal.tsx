/**
 * 산출 내역서 — 「확인 처리」 시 노출되는 지급조서 확인 모달 (프로그램·강사 상세 공통)
 */

import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import './payment-order-payment-confirmation-modal.css'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatKoreanDateWithWeekday(value: Dayjs): string {
  return `${value.format('YYYY. MM. DD')}(${KO_DOW[value.day()]})`
}

/** 해당 월의 셋째주 화요일 (강의비 지급 예정일 기본값) */
function thirdTuesdayOfMonth(monthRef: Dayjs): Dayjs {
  let d = monthRef.startOf('month')
  let count = 0
  const m = monthRef.month()
  while (d.month() === m) {
    if (d.day() === 2) {
      count++
      if (count === 3) return d
    }
    d = d.add(1, 'day')
  }
  return monthRef.date(15)
}

export interface PaymentOrderPaymentConfirmationModalProps {
  open: boolean
  onCancel: () => void
  /** 선택한 강의비 지급 예정일(ISO YYYY-MM-DD) */
  onConfirm: (payload: { lectureFeePaymentScheduledDateIso: string }) => void
  data: PaymentOrderProgramCalculationStatement | null
}

function getInstructorName(statement: PaymentOrderProgramCalculationStatement): string {
  if (statement.context === 'instructor') return statement.basic.nameKo
  return statement.basic.instructorNameKo
}

export function PaymentOrderPaymentConfirmationModal({
  open,
  onCancel,
  onConfirm,
  data,
}: PaymentOrderPaymentConfirmationModalProps) {
  const block0 = data?.blocks[0]
  const instructorName = data ? getInstructorName(data) : ''

  const [expectedDate, setExpectedDate] = useState<Dayjs>(() =>
    thirdTuesdayOfMonth(dayjs().add(1, 'month'))
  )

  useEffect(() => {
    if (open) {
      setExpectedDate(thirdTuesdayOfMonth(dayjs().add(1, 'month')))
    }
  }, [open])

  const canShow = Boolean(open && data && block0)

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title="지급조서 확인"
      width={600}
      className="payment-order-payment-confirm-modal"
      footer={
        <div className="payment-order-payment-confirm__footer-actions">
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton
            variant="primary"
            size="filter-wide"
            modalTeal
            onClick={() =>
              onConfirm({ lectureFeePaymentScheduledDateIso: expectedDate.format('YYYY-MM-DD') })
            }
          >
            지급조서 확인 완료
          </AppButton>
        </div>
      }
    >
      {block0 ? (
        <div className="payment-order-payment-confirm">
          <p className="payment-order-payment-confirm__line">
            아래 항목에 대한 <strong className="payment-order-payment-confirm__name">{instructorName}</strong>
            님의 강의비 지급 요청을 확인 처리하시겠습니까?
          </p>
          <p className="payment-order-payment-confirm__line">
            강의비는 <strong>매월 셋째주 화요일</strong>에 지급됩니다.
          </p>
          <div className="payment-order-payment-confirm__detail-line" aria-label="참여 기관·강의일·회차">
            <span>{block0.institutionName}</span>
            <span className="payment-order-payment-confirm__sep" aria-hidden>
              |
            </span>
            <span>{block0.lectureDateDisplay}</span>
            <span className="payment-order-payment-confirm__sep" aria-hidden>
              |
            </span>
            <span>{block0.lectureSessionDisplay}</span>
          </div>
          <div className="payment-order-payment-confirm__date-block">
            <span className="payment-order-payment-confirm__date-label">강의비 지급 예정일</span>
            <DatePicker
              className="payment-order-payment-confirm__date-picker"
              value={expectedDate}
              onChange={d => d && setExpectedDate(d)}
              format={formatKoreanDateWithWeekday}
              suffixIcon={<CalendarOutlined />}
              allowClear={false}
              inputReadOnly
              popupStyle={{ zIndex: 1200 }}
            />
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
