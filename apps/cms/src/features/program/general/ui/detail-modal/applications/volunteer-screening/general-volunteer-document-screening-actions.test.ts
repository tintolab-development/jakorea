import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import {
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT,
  GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT,
} from '@/features/program/general/lib/volunteer-screening-constants'
import {
  requestGeneralVolunteerDocumentBulkApprove,
  requestGeneralVolunteerDocumentBulkReject,
} from './general-volunteer-document-screening-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

describe('general-volunteer-document-screening-actions', () => {
  const onOpenSingleApprove = vi.fn()
  const onOpenBulkApprove = vi.fn()
  const onOpenSingleReject = vi.fn()
  const onOpenBulkReject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty selection alert for approve', () => {
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: [],
      selectedDocumentStatuses: [],
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT
    )
    expect(onOpenSingleApprove).not.toHaveBeenCalled()
    expect(onOpenBulkApprove).not.toHaveBeenCalled()
  })

  it('blocks approve when selection includes non-pending rows', () => {
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: ['1', '2'],
      selectedDocumentStatuses: ['pending', 'pass'],
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildApplicationProcessedSelectionAlert('volunteer')
    )
    expect(onOpenBulkApprove).not.toHaveBeenCalled()
  })

  it('blocks approve with participant noun when subjectKind is participant', () => {
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: ['1', '2'],
      selectedDocumentStatuses: ['pending', 'pass'],
      subjectKind: 'participant',
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildApplicationProcessedSelectionAlert('participant')
    )
  })

  it('opens bulk approve only for pending rows', () => {
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: ['1', '2'],
      selectedDocumentStatuses: ['pending', 'pending'],
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(onOpenBulkApprove).toHaveBeenCalledTimes(1)
  })

  it('blocks reject when selection includes fail status', () => {
    requestGeneralVolunteerDocumentBulkReject({
      selectedIds: ['1'],
      selectedDocumentStatuses: ['fail'],
      onOpenSingleReject,
      onOpenBulkReject,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildApplicationProcessedSelectionAlert('volunteer')
    )
    expect(onOpenSingleReject).not.toHaveBeenCalled()
  })

  it('shows empty selection alert for reject', () => {
    requestGeneralVolunteerDocumentBulkReject({
      selectedIds: [],
      selectedDocumentStatuses: [],
      onOpenSingleReject,
      onOpenBulkReject,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_REJECT_ALERT
    )
  })
})
