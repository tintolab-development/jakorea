/**
 * 강의 진행 일자 셀 — 날짜(요일) · 세로 디바이더 · N차시
 * `ProgramDetailTdDivider` 스펙(1×13·opacity·default-BK) + 양옆 gap 10px
 */

import {
  ProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { formatKoreanDateWithWeekday } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import './payment-order-lecture-date-session-cell.css'

export function PaymentOrderLectureDateSessionCell(props: {
  lectureDate: string
  sessionOrdinal: number
}) {
  const { lectureDate, sessionOrdinal } = props
  return (
    <div className="payment-order-lecture-date-session-cell">
      <ProgramDetailTdSegmentWrap>
        <span>{formatKoreanDateWithWeekday(lectureDate)}</span>
        <ProgramDetailTdDivider />
        <span>{sessionOrdinal}차시</span>
      </ProgramDetailTdSegmentWrap>
    </div>
  )
}
