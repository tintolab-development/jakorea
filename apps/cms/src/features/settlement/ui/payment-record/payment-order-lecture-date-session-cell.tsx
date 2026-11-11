/**
 * 교육 진행 일자 셀 — 날짜(요일) · 세로 디바이더 · N회차
 * `ProgramDetailTdDivider` 스펙(1×13·opacity·default-BK) + 양옆 gap 10px
 * 회차(`session_no`)가 없으면(사전교육 등) 날짜만 — 0회차를 만들지 않는다.
 */

import {
  ProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/shared/map-frontend-fields'
import { formatKoreanDateWithWeekday } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import './payment-order-lecture-date-session-cell.css'

export function PaymentOrderLectureDateSessionCell(props: {
  lectureDate: string
  sessionOrdinal: number | null
}) {
  const { lectureDate, sessionOrdinal } = props
  const roundLabel = formatLectureSessionLabel(sessionOrdinal)
  return (
    <div className="payment-order-lecture-date-session-cell">
      <ProgramDetailTdSegmentWrap>
        <span>{formatKoreanDateWithWeekday(lectureDate)}</span>
        {roundLabel !== '-' ? (
          <>
            <ProgramDetailTdDivider />
            <span>{roundLabel}</span>
          </>
        ) : null}
      </ProgramDetailTdSegmentWrap>
    </div>
  )
}
