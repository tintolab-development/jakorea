/**
 * 프로그램 승인 현황 — 테이블·필터용 텍스트 표기 (배지 배경 없음, 상태별 글자색)
 */

import { APPROVAL_STATUS_LABELS, type ApprovalStatusKey } from './textbook-status-badge'
import './approval-status-text.css'

export type { ApprovalStatusKey }

interface ApprovalStatusTextProps {
  status: ApprovalStatusKey
  className?: string
}

export function ApprovalStatusText({ status, className }: ApprovalStatusTextProps) {
  return (
    <span
      className={['approval-status-text', `approval-status-text--${status}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {APPROVAL_STATUS_LABELS[status]}
    </span>
  )
}
