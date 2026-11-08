import {
  APPROVAL_STATUS_LABELS,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import { CALENDAR_APPROVAL_STATUS_TEXT_COLOR } from '@/shared/constants/approval-status-calendar-colors'
import { StatusOutlineTag } from '@/shared/components/status-outline-tag'

/** 캘린더 우측 일별 리스트 전용 승인 상태 Tag (Figma Status / Tag / 승인 현황 14804:19711) */
export function CalendarApprovalStatusBadge({ status }: { status: ApprovalStatusKey }) {
  return (
    <StatusOutlineTag
      label={APPROVAL_STATUS_LABELS[status]}
      accentColor={CALENDAR_APPROVAL_STATUS_TEXT_COLOR[status]}
    />
  )
}
