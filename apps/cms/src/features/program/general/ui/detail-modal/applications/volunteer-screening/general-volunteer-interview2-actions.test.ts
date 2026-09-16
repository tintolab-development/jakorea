import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import {
  isGeneralVolunteerInterview2SelectableForResult,
  requestGeneralVolunteerInterview2BulkFail,
  requestGeneralVolunteerInterview2BulkPass,
} from './general-volunteer-interview2-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

vi.mock('@/features/program/general/lib/general-volunteer-interview2-display', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/features/program/general/lib/general-volunteer-interview2-display')
    >()
  return {
    ...actual,
    resolveGeneralEffectiveSecondInterviewStatus: vi.fn(
      (row: { secondInterviewScreeningStatus: string }) => row.secondInterviewScreeningStatus
    ),
  }
})

const waitingRow = {
  interviewAssignmentStatus: 'assigned' as const,
  secondInterviewScreeningStatus: 'waiting' as const,
  assignedInterviewDateLabel: '26. 12. 01(화)',
  assignedInterviewTime: '14:00 ~ 14:30',
}

const completedRow = {
  ...waitingRow,
  secondInterviewScreeningStatus: 'completed' as const,
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

  it('treats waiting as selectable and completed/pass as processed', () => {
    expect(isGeneralVolunteerInterview2SelectableForResult(waitingRow)).toBe(true)
    expect(isGeneralVolunteerInterview2SelectableForResult(completedRow)).toBe(false)
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
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpenBulkPass).not.toHaveBeenCalled()
  })

  it('blocks bulk pass when selection includes completed (interview done) rows', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1', '2'],
      selectedRows: [waitingRow, completedRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpenBulkPass).not.toHaveBeenCalled()
  })

  it('blocks bulk pass with participant noun when subjectKind is participant', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1'],
      selectedRows: [passedRow],
      subjectKind: 'participant',
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildInterview2ProcessedSelectionAlert('participant')
    )
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
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpenSingleFail).not.toHaveBeenCalled()
  })
})
