import { StatusBadge } from '@/shared/components/status-badge'
import { getDocumentScreeningTextPresentation, type DocumentScreeningStatus } from '../../lib/volunteer-screening/document-screening-presentation'

export interface DocumentScreeningStatusTextProps { status: DocumentScreeningStatus }
export function DocumentScreeningStatusText({ status }: DocumentScreeningStatusTextProps) {
  return <StatusBadge domain="custom" variant="text" {...getDocumentScreeningTextPresentation(status)}
    className={`ujat-doc-screening-status-text ujat-doc-screening-status-text--${status}`} />
}
