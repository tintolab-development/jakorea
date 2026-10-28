import type { GeminiInstitutionApprovalStatus } from '../../model/recruitment/institution-application-types'
import './institution-application-tab.css'

export const GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL: Record<
  GeminiInstitutionApprovalStatus,
  string
> = {
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '신청 반려',
}

const STATUS_MODIFIER: Record<GeminiInstitutionApprovalStatus, string> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export function GeminiInstitutionApprovalStatusBadge({
  status,
}: {
  status: GeminiInstitutionApprovalStatus
}) {
  return (
    <span
      className={`gemini-institution-approval-status gemini-institution-approval-status--${STATUS_MODIFIER[status]}`}
    >
      {GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL[status]}
    </span>
  )
}
