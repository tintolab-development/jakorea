import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { openUjatVolunteerInterview2BulkPassModal } from './actions'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

function row(overrides: Partial<UjatVolunteerApplicantRow> = {}): UjatVolunteerApplicantRow {
  return {
    interviewAssignmentStatus: 'assigned',
    secondInterviewScreeningStatus: 'completed',
    assignedInterviewDateLabel: '2020.01.01',
    assignedInterviewTime: '10:00 ~ 10:30',
    managerAScore: 4,
    managerBScore: 5,
    ...overrides,
  } as UjatVolunteerApplicantRow
}

describe('openUjatVolunteerInterview2BulkPassModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('선택이 없으면 안내하고 모달을 열지 않는다', () => {
    const onOpen = vi.fn()
    openUjatVolunteerInterview2BulkPassModal({
      selectedIds: [],
      selectedRows: [],
      onOpen,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(NO_SELECTION_ALERT)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('이미 처리된 행이 포함되면 안내하고 모달을 열지 않는다', () => {
    const onOpen = vi.fn()
    openUjatVolunteerInterview2BulkPassModal({
      selectedIds: ['1', '2'],
      selectedRows: [row(), row({ secondInterviewScreeningStatus: 'pass' })],
      onOpen,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('평가 미완료 행이 포함되면 안내하고 모달을 열지 않는다', () => {
    const onOpen = vi.fn()
    openUjatVolunteerInterview2BulkPassModal({
      selectedIds: ['1'],
      selectedRows: [row({ managerBScore: null })],
      onOpen,
    })
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      buildInterview2ProcessedSelectionAlert('volunteer')
    )
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('선택 가능한 행만 있으면 모달을 연다', () => {
    const onOpen = vi.fn()
    openUjatVolunteerInterview2BulkPassModal({
      selectedIds: ['1', '2'],
      selectedRows: [row({ id: '1' }), row({ id: '2' })],
      onOpen,
    })
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
