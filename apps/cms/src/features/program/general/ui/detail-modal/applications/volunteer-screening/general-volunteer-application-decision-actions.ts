import {
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function canSelectVolunteerApplicationForDecision(row: {
  availableActions: readonly string[]
}): boolean {
  return row.availableActions.some(action => {
    const normalized = action.trim().toUpperCase()
    return normalized === 'APPROVE' || normalized === 'REJECT'
  })
}

function hasProcessedApplicationSelection(
  rows: readonly { availableActions: readonly string[] }[]
): boolean {
  return rows.some(row => !canSelectVolunteerApplicationForDecision(row))
}

export function requestGeneralVolunteerApplicationBulkApprove({
  selectedIds,
  selectedRows,
  onOpenSingleApprove,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  selectedRows: readonly { availableActions: readonly string[] }[]
  onOpenSingleApprove: () => void
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT)
    return
  }
  if (hasProcessedApplicationSelection(selectedRows)) {
    cmsAlertModal.show(buildApplicationProcessedSelectionAlert('volunteer'))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleApprove()
    return
  }
  onOpenBulkApprove()
}

export function requestGeneralVolunteerApplicationBulkReject({
  selectedIds,
  selectedRows,
  onOpenSingleReject,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  selectedRows: readonly { availableActions: readonly string[] }[]
  onOpenSingleReject: () => void
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT)
    return
  }
  if (hasProcessedApplicationSelection(selectedRows)) {
    cmsAlertModal.show(buildApplicationProcessedSelectionAlert('volunteer'))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleReject()
    return
  }
  onOpenBulkReject()
}
