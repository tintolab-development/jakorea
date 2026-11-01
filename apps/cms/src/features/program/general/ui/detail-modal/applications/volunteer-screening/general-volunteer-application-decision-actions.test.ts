import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import { GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT } from '@/features/program/general/lib/volunteer-screening-constants'
import {
  canSelectVolunteerApplicationForDecision,
  requestGeneralVolunteerApplicationBulkApprove,
  requestGeneralVolunteerApplicationBulkReject,
} from './general-volunteer-application-decision-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const pendingRow = { availableActions: ['APPROVE', 'REJECT'] }
const processedRow = { availableActions: ['VIEW'] }

describe('general-volunteer-application-decision-actions', () => {
  const onOpenSingleApprove = vi.fn()
  const onOpenBulkApprove = vi.fn()
  const onOpenSingleReject = vi.fn()
  const onOpenBulkReject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows rows with APPROVE or REJECT', () => {
    expect(canSelectVolunteerApplicationForDecision(pendingRow)).toBe(true)
    expect(canSelectVolunteerApplicationForDecision(processedRow)).toBe(false)
  })

  it('shows empty selection alert', () => {
    requestGeneralVolunteerApplicationBulkApprove({
      selectedIds: [],
      selectedRows: [],
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT
    )
  })

  it('blocks processed rows', () => {
    requestGeneralVolunteerApplicationBulkReject({
      selectedIds: ['1', '2'],
      selectedRows: [pendingRow, processedRow],
      onOpenSingleReject,
      onOpenBulkReject,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildApplicationProcessedSelectionAlert('volunteer')
    )
    expect(onOpenBulkReject).not.toHaveBeenCalled()
  })

  it('opens bulk approve for two pending rows', () => {
    requestGeneralVolunteerApplicationBulkApprove({
      selectedIds: ['1', '2'],
      selectedRows: [pendingRow, pendingRow],
      onOpenSingleApprove,
      onOpenBulkApprove,
    })
    expect(onOpenBulkApprove).toHaveBeenCalledTimes(1)
  })
})
