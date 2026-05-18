import type { UjatDocumentScreeningStatus } from '@/features/program/model/ujat-volunteer-screening-constants'
import { UJAT_DOCUMENT_SCREENING_STATUS_LABELS } from '@/features/program/model/ujat-volunteer-screening-constants'
import './document-screening-status-text.css'

export interface DocumentScreeningStatusTextProps {
  status: UjatDocumentScreeningStatus
}

export function DocumentScreeningStatusText({ status }: DocumentScreeningStatusTextProps) {
  return (
    <span className={`ujat-doc-screening-status-text ujat-doc-screening-status-text--${status}`}>
      {UJAT_DOCUMENT_SCREENING_STATUS_LABELS[status]}
    </span>
  )
}
