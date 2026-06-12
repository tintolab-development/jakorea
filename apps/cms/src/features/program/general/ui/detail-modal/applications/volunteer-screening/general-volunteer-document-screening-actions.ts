import {
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function requestGeneralVolunteerDocumentBulkApprove({
  selectedIds,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT)
    return
  }
  onOpenBulkApprove()
}

export function requestGeneralVolunteerDocumentBulkReject({
  selectedIds,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT)
    return
  }
  onOpenBulkReject()
}
