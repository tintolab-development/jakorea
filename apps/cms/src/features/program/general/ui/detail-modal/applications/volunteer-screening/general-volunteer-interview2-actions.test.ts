import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import {
  isGeneralVolunteerInterview2EffectiveStatusSelectableForResult,
  isGeneralVolunteerInterview2SelectableForResult,
  requestGeneralVolunteerInterview2BulkFail,
  requestGeneralVolunteerInterview2BulkPass,
} from './general-volunteer-interview2-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

vi.mock(
  '@/features/program/general/lib/general-volunteer-interview2-display',
  async importOriginal => {
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
  }
)

const waitingRow = {
  interviewAssignmentStatus: 'assigned' as const,
  secondInterviewScreeningStatus: 'waiting' as const,
  assignedInterviewDateLabel: '26. 12. 01(화)',
  assignedInterviewTime: '14:00 ~ 14:30',
  availableActions: ['APPROVE', 'REJECT'],
  managerAScore: 4,
  managerBScore: 5,
}

const completedRow = {
  ...waitingRow,
  secondInterviewScreeningStatus: 'completed' as const,
}

const passedRow = {
  ...waitingRow,
  secondInterviewScreeningStatus: 'pass' as const,
}

const completedWithoutEvaluationRow = {
  ...completedRow,
  managerBScore: null,
}

const completedWithoutResultActionRow = {
  ...completedRow,
  availableActions: ['VIEW'],
}

describe('general-volunteer-interview2-actions', () => {
  const onOpenSinglePass = vi.fn()
  const onOpenBulkPass = vi.fn()
  const onOpenSingleFail = vi.fn()
  const onOpenBulkFail = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires completed status, complete evaluation, and result actions', () => {
    expect(isGeneralVolunteerInterview2SelectableForResult(waitingRow)).toBe(false)
    expect(isGeneralVolunteerInterview2SelectableForResult(completedRow)).toBe(true)
    expect(isGeneralVolunteerInterview2SelectableForResult(completedWithoutEvaluationRow)).toBe(
      false
    )
    expect(isGeneralVolunteerInterview2SelectableForResult(completedWithoutResultActionRow)).toBe(
      false
    )
    expect(isGeneralVolunteerInterview2SelectableForResult(passedRow)).toBe(false)
    expect(isGeneralVolunteerInterview2EffectiveStatusSelectableForResult('waiting')).toBe(false)
    expect(isGeneralVolunteerInterview2EffectiveStatusSelectableForResult('pass')).toBe(false)
    expect(isGeneralVolunteerInterview2EffectiveStatusSelectableForResult('withdrawn')).toBe(false)
    expect(isGeneralVolunteerInterview2EffectiveStatusSelectableForResult('completed')).toBe(true)
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

  it('opens single pass when one completed row is selected', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1'],
      selectedRows: [completedRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(onOpenSinglePass).toHaveBeenCalledTimes(1)
    expect(onOpenBulkPass).not.toHaveBeenCalled()
  })

  it('opens bulk pass when selection includes completed rows without a final result', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1', '2'],
      selectedRows: [completedRow, completedRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(onOpenBulkPass).toHaveBeenCalledTimes(1)
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

  it('blocks bulk pass for waiting-only selection', () => {
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ['1', '2'],
      selectedRows: [waitingRow, waitingRow],
      onOpenSinglePass,
      onOpenBulkPass,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpenBulkPass).not.toHaveBeenCalled()
  })

  it('opens single fail when one completed row is selected', () => {
    requestGeneralVolunteerInterview2BulkFail({
      selectedIds: ['1'],
      selectedRows: [completedRow],
      onOpenSingleFail,
      onOpenBulkFail,
    })
    expect(onOpenSingleFail).toHaveBeenCalledTimes(1)
    expect(onOpenBulkFail).not.toHaveBeenCalled()
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
