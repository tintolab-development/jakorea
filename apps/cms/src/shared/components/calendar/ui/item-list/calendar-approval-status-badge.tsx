import {
  APPROVAL_STATUS_LABELS,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import { CALENDAR_APPROVAL_STATUS_COLORS } from '@/shared/constants/approval-status-calendar-colors'
import './calendar-approval-status-badge.css'

/** 캘린더 우측 일별 리스트 전용 승인 상태 태그 (테이블 배지와 스타일 분리) */
export function CalendarApprovalStatusBadge({ status }: { status: ApprovalStatusKey }) {
  const colors = CALENDAR_APPROVAL_STATUS_COLORS[status]

  return (
    <span
      className="calendar-outline-status-badge calendar-approval-status-badge"
      style={{
        color: colors.text,
        borderColor: colors.border,
        background: colors.background,
      }}
    >
      {APPROVAL_STATUS_LABELS[status]}
    </span>
  )
}
