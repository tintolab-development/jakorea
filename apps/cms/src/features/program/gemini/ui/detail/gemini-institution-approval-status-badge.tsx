import { Tag } from 'antd'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { GeminiInstitutionApprovalStatus } from '../../model/recruitment/institution-application-mock'
import '@/shared/components/textbook-status-badge.css'

export const GEMINI_INSTITUTION_APPROVAL_STATUS_OPTIONS: GeminiInstitutionApprovalStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
]

export const GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL: Record<
  GeminiInstitutionApprovalStatus,
  string
> = {
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '신청 반려',
}

const STATUS_TO_APPROVAL_KEY: Record<GeminiInstitutionApprovalStatus, ApprovalStatusKey> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export function GeminiInstitutionApprovalStatusBadge({
  status,
}: {
  status: GeminiInstitutionApprovalStatus
}) {
  const approvalKey = STATUS_TO_APPROVAL_KEY[status]
  return (
    <Tag
      className={`app-status-badge textbook-status-badge--${approvalKey}`.trim()}
      style={{ margin: 0 }}
    >
      {GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL[status]}
    </Tag>
  )
}
