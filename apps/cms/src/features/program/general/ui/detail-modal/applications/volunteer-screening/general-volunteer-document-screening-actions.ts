import {
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
  type GeneralDocumentScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import {
  buildApplicationProcessedSelectionAlert,
  type ApplicationBulkSubjectNoun,
} from '@/features/program/general/lib/application-processed-selection-alert'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

function toApplicationBulkSubjectNoun(
  subjectKind: ScreeningSubjectKind
): ApplicationBulkSubjectNoun {
  return subjectKind === 'participant' ? 'participant' : 'volunteer'
}

function hasNonPendingDocumentSelection(
  statuses: readonly GeneralDocumentScreeningStatus[]
): boolean {
  return statuses.some(status => status !== 'pending')
}

export function requestGeneralVolunteerDocumentBulkApprove({
  selectedIds,
  selectedDocumentStatuses,
  subjectKind = 'volunteer',
  onOpenSingleApprove,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  selectedDocumentStatuses: readonly GeneralDocumentScreeningStatus[]
  subjectKind?: ScreeningSubjectKind
  onOpenSingleApprove: () => void
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT)
    return
  }
  if (hasNonPendingDocumentSelection(selectedDocumentStatuses)) {
    cmsAlertModal.show(
      buildApplicationProcessedSelectionAlert(toApplicationBulkSubjectNoun(subjectKind))
    )
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
  subjectKind = 'volunteer',
  onOpenSingleReject,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  selectedDocumentStatuses: readonly GeneralDocumentScreeningStatus[]
  subjectKind?: ScreeningSubjectKind
  onOpenSingleReject: () => void
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT)
    return
  }
  if (hasNonPendingDocumentSelection(selectedDocumentStatuses)) {
    cmsAlertModal.show(
      buildApplicationProcessedSelectionAlert(toApplicationBulkSubjectNoun(subjectKind))
    )
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleReject()
    return
  }
  onOpenBulkReject()
}
