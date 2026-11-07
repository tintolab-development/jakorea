import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  approveRemoteMock,
  bulkApproveRemoteMock,
  shouldUseRemoteMock,
} = vi.hoisted(() => ({
  approveRemoteMock: vi.fn(),
  bulkApproveRemoteMock: vi.fn(),
  shouldUseRemoteMock: vi.fn(() => true),
}))

vi.mock('./capabilities', () => ({
  shouldUseGeminiVisitingTrainingRemoteApi: shouldUseRemoteMock,
}))

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client')
  return {
    ...actual,
    approveGeminiOrganizationApplicationRemote: approveRemoteMock,
    bulkApproveGeminiOrganizationApplicationsRemote: bulkApproveRemoteMock,
  }
})

import { approveGeminiOrganizationApplications } from './service'

describe('approveGeminiOrganizationApplications', () => {
  beforeEach(() => {
    approveRemoteMock.mockReset()
    bulkApproveRemoteMock.mockReset()
    shouldUseRemoteMock.mockReturnValue(true)
    approveRemoteMock.mockResolvedValue(undefined)
    bulkApproveRemoteMock.mockResolvedValue({
      requestedCount: 2,
      successCount: 2,
      failureCount: 0,
      successIds: [1691535, 1691536],
      failures: [],
    })
  })

  it('단건은 Gemini 전용 approve 를 timing 과 함께 호출한다', async () => {
    await approveGeminiOrganizationApplications(['1691535'], {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })

    expect(approveRemoteMock).toHaveBeenCalledWith('1691535', {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })
    expect(bulkApproveRemoteMock).not.toHaveBeenCalled()
  })

  it('일괄 즉시 승인은 ids 만 bulk-approve 한다', async () => {
    await approveGeminiOrganizationApplications(['1691535', '1691536'], {
      timing: 'IMMEDIATE',
    })

    expect(bulkApproveRemoteMock).toHaveBeenCalledWith([1691535, 1691536], {
      timing: 'IMMEDIATE',
    })
    expect(approveRemoteMock).not.toHaveBeenCalled()
  })

  it('일괄 알림 직접 설정은 bulk-approve + SCHEDULED 를 호출한다', async () => {
    await approveGeminiOrganizationApplications(['1691535', '1691536'], {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })

    expect(bulkApproveRemoteMock).toHaveBeenCalledWith([1691535, 1691536], {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })
    expect(approveRemoteMock).not.toHaveBeenCalled()
  })

  it('일괄 발표일 알림은 단건 approve 를 반복한다', async () => {
    await approveGeminiOrganizationApplications(['1691535', '1691536'], {
      timing: 'ON_ANNOUNCEMENT',
    })

    expect(approveRemoteMock).toHaveBeenCalledTimes(2)
    expect(bulkApproveRemoteMock).not.toHaveBeenCalled()
  })
})
