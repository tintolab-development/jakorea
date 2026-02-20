/**
 * 결재 현황 배지 — 교재 현황과 동일 배지 컴포넌트(TextbookStatusBadge) 사용, 배경/텍스트색만 다름
 */

import {
  TextbookStatusBadge,
  APPROVAL_STATUS_LABELS,
  type ApprovalStatusKey,
} from './textbook-status-badge'

export type { ApprovalStatusKey }
export { APPROVAL_STATUS_LABELS }

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusKey
  className?: string
}

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  return <TextbookStatusBadge variant="approval" status={status} className={className} />
}
