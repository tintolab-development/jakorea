/** 프로그램 승인 Text — 업무별 spec과 공통 Text renderer를 조합한다. */
import { getApprovalStatusTextPresentation, type ApprovalStatusKey } from '@/shared/lib/status-tag-specs'
import { StatusBadge } from './status-badge'

export type { ApprovalStatusKey }

interface ApprovalStatusTextProps {
  status: ApprovalStatusKey
  className?: string
}

export function ApprovalStatusText({ status, className }: ApprovalStatusTextProps) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      {...getApprovalStatusTextPresentation(status)}
      className={['approval-status-text', `approval-status-text--${status}`, className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
