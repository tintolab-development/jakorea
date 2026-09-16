import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { GENERAL_VOLUNTEER_INTERVIEW2_PROCESSED_SELECTION_ALERT } from '@/features/program/general/lib/volunteer-screening-constants'
import {
  isGeneralVolunteerInterview2SelectableForResult,
  requestGeneralVolunteerInterview2BulkFail,
  requestGeneralVolunteerInterview2BulkPass,
} from './general-volunteer-interview2-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const waitingRow = {
  interviewAssignmentStatus: 'assigned' as const,
  secondInterviewScreeningStatus: 'waiting' as const,
  assignedInterviewDateLabel: '26. 12. 01(화)',
  assignedInterviewTime: '14:00 ~ 14:30',
}

const passedRow = {
  ...waitingRow,
  secondInterviewScreeningStatus: 'pass' as const,
}

describe('general-volunteer-interview2-actions', () => {
  const onOpenSinglePass = vi.fn()
  const onOpenBulkPass = vi.fn()
  const onOpenSingleFail = vi.fn()
  const onOpenBulkFail = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats waiting/completed as selectable and pass as processed', () => {
    expect(isGeneralVolunteerInterview2SelectableForResult(waitingRow)).toBe(true)
    expect(isGeneralVolunteerInterview2SelectableForResult(passedRow)).toBe(false)
  })

  it('blocks bulk pass when selection includes processed rows', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1', '2'],
      selectedRows: [waitingRow, passedRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      GENERAL_VOLUNTEER_INTERVIEW2_PROCESSED_SELECTION_ALERT
    )
    expect(onOpenBulkPass).not.toHaveBeenCalled()
  })

  it('opens bulk pass for waiting-only selection', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1', '2'],
      selectedRows: [waitingRow, waitingRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(onOpenBulkPass).toHaveBeenCalledTimes(1)
  })

  it('blocks bulk fail for single already-failed row', () => {
    requestGeneralVolunteerInterview2BulkFail({
      selectedIds: ['1'],
      selectedRows: [{ ...waitingRow, secondInterviewScreeningStatus: 'fail' }],
      onOpenSingleFail,
      onOpenBulkFail,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      GENERAL_VOLUNTEER_INTERVIEW2_PROCESSED_SELECTION_ALERT
    )
    expect(onOpenSingleFail).not.toHaveBeenCalled()
  })
})
