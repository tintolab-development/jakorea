import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  approveIndividualApplicationRemote,
  approveIndividualApplicationWithEducationScopeRemote,
  bulkApproveIndividualApplicationsWithEducationScopeRemote,
} from './applications-api-client'

describe('individual approval education scope client', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
  })

  it('posts approve-with-education-scope and does not call bare approve', async () => {
    customInstanceMock.mockResolvedValue({
      decision: {
        applicationId: 168652,
        applicationType: 'INDIVIDUAL',
        fromStatus: 'WAITING_REVIEW',
        toStatus: 'APPROVED',
        participantId: 1,
        availableActions: [],
      },
      educationScope: { scheduleIds: [168351, 900] },
    })

    await approveIndividualApplicationWithEducationScopeRemote('168652', {
      confirmedScheduleIds: [168351],
      expectedScopeRevision: 0,
      reason: '교육 일정 확정',
    })

    expect(customInstanceMock).toHaveBeenCalledTimes(1)
    expect(customInstanceMock.mock.calls[0]?.[0]).toEqual({
      url: '/api/admin/individual-applications/168652/approve-with-education-scope',
      method: 'POST',
      data: {
        confirmedScheduleIds: [168351],
        expectedScopeRevision: 0,
        reason: '교육 일정 확정',
      },
    })
    expect(String(customInstanceMock.mock.calls[0]?.[0].url)).not.toMatch(/\/approve$/)
  })

  it('posts per-applicant bulk targets', async () => {
    customInstanceMock.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      successIds: [12345],
      failures: [{ id: 12346, code: 'APPLICATION_DECISION_CONFLICT', message: '이미 처리된 신청입니다.' }],
    })

    await bulkApproveIndividualApplicationsWithEducationScopeRemote({
      reason: '교육 일정 일괄 확정',
      targets: [
        { applicationId: 12345, confirmedScheduleIds: [123], expectedScopeRevision: 0 },
        { applicationId: 12346, confirmedScheduleIds: [124, 125], expectedScopeRevision: 0 },
      ],
    })

    expect(customInstanceMock.mock.calls[0]?.[0]).toEqual({
      url: '/api/admin/individual-applications/bulk-approve-with-education-scope',
      method: 'POST',
      data: {
        reason: '교육 일정 일괄 확정',
        targets: [
          { applicationId: 12345, confirmedScheduleIds: [123], expectedScopeRevision: 0 },
          { applicationId: 12346, confirmedScheduleIds: [124, 125], expectedScopeRevision: 0 },
        ],
      },
    })
  })

  it('keeps the legacy approve path separate from scope approval', async () => {
    customInstanceMock.mockResolvedValue({ applicationId: 1, toStatus: 'APPROVED' })
    await approveIndividualApplicationRemote('1')
    expect(customInstanceMock.mock.calls[0]?.[0].url).toBe(
      '/api/admin/individual-applications/1/approve'
    )
  })
})
