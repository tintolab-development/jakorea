import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UjatDocumentScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

export function patchUjatVolunteerDocumentScreeningStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatDocumentScreeningStatus
): UjatVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row => (idSet.has(row.id) ? { ...row, documentScreeningStatus: status } : row))
}

export function alertUjatVolunteerDocumentSelectionRequired(): void {
  cmsAlertModal.show(NO_SELECTION_ALERT)
}
