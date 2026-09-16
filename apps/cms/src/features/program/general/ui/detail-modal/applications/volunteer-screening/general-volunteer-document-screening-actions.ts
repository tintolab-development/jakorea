import {
  GENERAL_VOLUNTEER_DOC_SCREENING_PROCESSED_SELECTION_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
  type GeneralDocumentScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

function hasNonPendingDocumentSelection(
  statuses: readonly GeneralDocumentScreeningStatus[]
): boolean {
  return statuses.some(status => status !== 'pending')
}

export function requestGeneralVolunteerDocumentBulkApprove({
  selectedIds,
  selectedDocumentStatuses,
  onOpenSingleApprove,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  selectedDocumentStatuses: readonly GeneralDocumentScreeningStatus[]
  onOpenSingleApprove: () => void
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT)
    return
  }
  if (hasNonPendingDocumentSelection(selectedDocumentStatuses)) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_PROCESSED_SELECTION_ALERT)
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleApprove()
    return
  }
  onOpenBulkApprove()
}

export function requestGeneralVolunteerDocumentBulkReject({
  selectedIds,
  selectedDocumentStatuses,
  onOpenSingleReject,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  selectedDocumentStatuses: readonly GeneralDocumentScreeningStatus[]
  onOpenSingleReject: () => void
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT)
    return
  }
  if (hasNonPendingDocumentSelection(selectedDocumentStatuses)) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_PROCESSED_SELECTION_ALERT)
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleReject()
    return
  }
  onOpenBulkReject()
}
