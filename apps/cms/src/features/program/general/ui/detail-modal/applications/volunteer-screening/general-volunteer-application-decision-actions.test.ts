import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import { GENERAL_VOLUNTEER_DOC_SCREENING_SELECT_ONE_APPROVE_ALERT } from '@/features/program/general/lib/volunteer-screening-constants'
import { VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT } from '@/features/program/shared/lib/application-eligibility-conflict'
import {
  canSelectVolunteerApplicationForDecision,
  formatVolunteerBulkActionFailures,
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

  it('uses 1365 승인 불가 안내 when every bulk failure is missing 1365 ID', () => {
    expect(
      formatVolunteerBulkActionFailures({
        requestedCount: 4,
        successCount: 0,
        failureCount: 4,
        failures: [1691680, 1691679, 1691678, 1691677].map(id => ({
          id,
          code: 'APPLICATION_DECISION_CONFLICT',
          message: '1365 ID 등록 후 봉사 프로그램 참여 승인이 가능합니다.',
        })),
      })
    ).toEqual(VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT)
  })

  it('keeps success count when some rows succeed and the rest lack 1365 ID', () => {
    expect(
      formatVolunteerBulkActionFailures({
        requestedCount: 2,
        successCount: 1,
        failureCount: 1,
        successIds: [1691680],
        failures: [
          {
            id: 1691679,
            code: 'APPLICATION_DECISION_CONFLICT',
            message: '1365 ID 등록 후 봉사 프로그램 참여 승인이 가능합니다.',
          },
        ],
      })
    ).toEqual({
      title: VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT.title,
      content:
        '요청 2건 중 성공 1건, 실패 1건입니다.\n\n' + VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT.content,
    })
  })

  it('formats bulk partial failures with id, code, and message', () => {
    expect(
      formatVolunteerBulkActionFailures({
        requestedCount: 2,
        successCount: 1,
        failureCount: 1,
        successIds: [1691680],
        failures: [
          {
            id: 1691679,
            code: 'VOLUNTEER_INTERVIEW_REQUIRED',
            message: '현재 상태에서는 처리할 수 없습니다.',
          },
        ],
      })
    ).toEqual({
      title: '일부 처리 실패',
      content:
        '요청 2건 중 성공 1건, 실패 1건입니다.\n1691679 VOLUNTEER_INTERVIEW_REQUIRED 현재 상태에서는 처리할 수 없습니다.',
    })
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
