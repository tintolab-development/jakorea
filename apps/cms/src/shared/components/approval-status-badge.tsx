/**
 * 결재 현황 태그 — 공통 `StatusTag` (`getApprovalStatusTag`)
 */

import { StatusTag } from './status-tag'
import {
  APPROVAL_STATUS_LABELS,
  getApprovalStatusTag,
  type ApprovalStatusKey,
} from '@/shared/lib/status-tag-specs'

export type { ApprovalStatusKey }
export { APPROVAL_STATUS_LABELS }

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusKey
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  return <StatusTag {...getApprovalStatusTag(status)} />
}
