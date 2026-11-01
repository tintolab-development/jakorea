import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UjatDocumentScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'

export function patchUjatVolunteerDocumentScreeningStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatDocumentScreeningStatus
): UjatVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row => (idSet.has(row.id) ? { ...row, documentScreeningStatus: status } : row))
}

export function alertUjatVolunteerDocumentSelectionRequired(action: 'approve' | 'reject'): void {
  cmsAlertModal.show({
    title: '항목 선택 안내',
    content: action === 'approve' ? '승인할 항목을 선택해 주세요.' : '반려할 항목을 선택해 주세요.',
  })
}
