import { StatusBadge } from '@/shared/components/status-badge'
import { getGeminiInstitutionApprovalStatusPresentation } from '../../lib/application-status-presentation'
export { GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL } from '../../lib/application-status-presentation'
import type { GeminiInstitutionApprovalStatus } from '../../model/recruitment/institution-application-types'
import './institution-application-tab.css'

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
    <StatusBadge
      domain="custom"
      variant="text"
      {...getGeminiInstitutionApprovalStatusPresentation(status)}
      className={`gemini-institution-approval-status gemini-institution-approval-status--${STATUS_MODIFIER[status]}`}
    />
  )
}
