import {
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function requestGeneralVolunteerDocumentBulkApprove({
  selectedIds,
  onOpenSingleApprove,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  onOpenSingleApprove: () => void
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT)
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
  onOpenSingleReject,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  onOpenSingleReject: () => void
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT)
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleReject()
    return
  }
  onOpenBulkReject()
}
