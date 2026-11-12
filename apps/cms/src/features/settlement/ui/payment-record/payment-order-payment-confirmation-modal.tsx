/**
 * 산출 내역서 — 「확인 처리」 시 노출되는 지급조서 확인 모달 (프로그램·강사 상세 공통)
 */

import { Fragment, useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { formatDateDotWithWeekday, isBeforeSeoulToday } from '@/shared/utils/date'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import { defaultLectureFeePaymentScheduledDate } from '@/features/settlement/lib/third-tuesday-of-month'
import {
  getPaymentApplicationCopy,
  type PaymentApplicationKind,
} from '@/features/settlement/lib/payment-application-copy'
import './payment-order-payment-confirmation-modal.css'

function formatKoreanDateWithWeekday(value: Dayjs): string {
  return formatDateDotWithWeekday(value)
}

export interface PaymentOrderPaymentConfirmationModalProps {
  open: boolean
  onCancel: () => void
  /** 선택한 계좌 지급 예정일(ISO YYYY-MM-DD) — 강사·봉사자·참여자 공통 */
  onConfirm: (payload: { lectureFeePaymentScheduledDateIso: string }) => void
  data: PaymentOrderProgramCalculationStatement | null
  /** 산출 내역서를 풀페이지 위(zIndex 지정)에서 열었을 때 그보다 위 */
  zIndex?: number
  /** 신청 유형별 문구 — 기본 강사 지급조서, 참여자·봉사자 영수증은 receipt */
  applicationKind?: PaymentApplicationKind
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
  zIndex,
  applicationKind,
}: PaymentOrderPaymentConfirmationModalProps) {
  const copy = getPaymentApplicationCopy(applicationKind)
  const block0 = data?.blocks[0]
  /** 기관·교육일·일정 칸(lectureSessionDisplay: 회차 또는 차시 원문) 중 값이 있는 것만 — 없는 개인 정산 등에서 끝 구분선이 남지 않게 */
  const detailParts = [
    block0?.institutionName,
    block0?.lectureDateDisplay,
    block0?.lectureSessionDisplay,
  ]
    .map(part => part?.trim() ?? '')
    .filter(part => part !== '' && part !== '-' && part !== '—')
  const instructorName = data ? getInstructorName(data) : ''

  const [expectedDate, setExpectedDate] = useState<Dayjs>(() =>
    defaultLectureFeePaymentScheduledDate()
  )

  useEffect(() => {
    if (open) {
      setExpectedDate(defaultLectureFeePaymentScheduledDate())
    }
  }, [open])

  const canShow = Boolean(open && data && block0)

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title="지급조서 확인 안내"
      width={600}
      zIndex={zIndex}
      className="payment-order-payment-confirm-modal"
      footer={
        <div className="payment-order-payment-confirm__footer-actions">
          <CmsButton variant="secondary" size="h40" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            onClick={() =>
              onConfirm({ lectureFeePaymentScheduledDateIso: expectedDate.format('YYYY-MM-DD') })
            }
          >
            확인 완료
          </CmsButton>
        </div>
      }
    >
      {block0 ? (
        <div className="payment-order-payment-confirm">
          <p className="payment-order-payment-confirm__line">
            <strong className="payment-order-payment-confirm__name">[{instructorName}]</strong>{' '}
            님의 {copy.confirmSubject} 신청을 확인 처리하시겠습니까?
          </p>
          <p className="payment-order-payment-confirm__line">
            {copy.payee}는 <strong>매월 셋째 주 화요일에 지급</strong>됩니다.
          </p>
          <div
            className="payment-order-payment-confirm__detail-line"
            aria-label="참여 기관·강의일·회차 또는 차시"
          >
            {detailParts.map((part, index) => (
              <Fragment key={`${index}-${part}`}>
                {index > 0 ? <ProgramDetailTdDivider /> : null}
                <span>{part}</span>
              </Fragment>
            ))}
          </div>
          <div className="payment-order-payment-confirm__date-block">
            <CmsDatePicker
              className="payment-order-payment-confirm__date-picker"
              label="계좌 지급 예정일"
              required
              inputSize="medium"
              width="100%"
              value={expectedDate}
              onChange={d => d && setExpectedDate(d)}
              disabledDate={current => isBeforeSeoulToday(current)}
              format={formatKoreanDateWithWeekday}
              allowClear={false}
              popupStyle={{ zIndex: (zIndex ?? 1000) + 200 }}
            />
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
