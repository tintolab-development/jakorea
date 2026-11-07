import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  approveVolunteerApplicationWithEducationScopeRemote,
  bulkApproveVolunteerApplicationsWithEducationScopeRemote,
  bulkVolunteerFinalResultsRemote,
  submitVolunteerFinalResultRemote,
} from './applications-api-client'

describe('volunteer approval with education scope client', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
  })

  it('posts approve-with-education-scope once with main-education ids only', async () => {
    customInstanceMock.mockResolvedValue({
      decision: {
        applicationId: 190201,
        applicationType: 'VOLUNTEER',
        toStatus: 'APPROVED',
        participantId: 11,
        availableActions: [],
      },
      educationScope: { scheduleIds: [9001, 7000] },
    })

    await approveVolunteerApplicationWithEducationScopeRemote('190201', {
      confirmedScheduleIds: [9001],
      expectedScopeRevision: 0,
      reason: '봉사 일정 배정',
    })

    expect(customInstanceMock).toHaveBeenCalledTimes(1)
    expect(customInstanceMock.mock.calls[0]?.[0]).toEqual({
      url: '/api/admin/volunteer-applications/190201/approve-with-education-scope',
      method: 'POST',
      data: {
        confirmedScheduleIds: [9001],
        expectedScopeRevision: 0,
        reason: '봉사 일정 배정',
      },
    })
    expect(String(customInstanceMock.mock.calls[0]?.[0].url)).not.toMatch(/\/final-result$/)
    expect(String(customInstanceMock.mock.calls[0]?.[0].url)).not.toMatch(
      /\/participants\/.+\/education-scope$/
    )
  })

  it('posts bulk-approve-with-education-scope without per-row PUT', async () => {
    customInstanceMock.mockResolvedValue({ successCount: 2, failureCount: 0 })

    await bulkApproveVolunteerApplicationsWithEducationScopeRemote({
      reason: '봉사 일정 배정',
      targets: [
        { applicationId: 190201, confirmedScheduleIds: [], expectedScopeRevision: 0 },
        { applicationId: 190202, confirmedScheduleIds: [], expectedScopeRevision: 0 },
      ],
      timing: 'ON_ANNOUNCEMENT',
    })

    expect(customInstanceMock).toHaveBeenCalledTimes(1)
    expect(customInstanceMock.mock.calls[0]?.[0]).toEqual({
      url: '/api/admin/volunteer-applications/bulk-approve-with-education-scope',
      method: 'POST',
      data: {
        reason: '봉사 일정 배정',
        targets: [
          { applicationId: 190201, confirmedScheduleIds: [], expectedScopeRevision: 0 },
          { applicationId: 190202, confirmedScheduleIds: [], expectedScopeRevision: 0 },
        ],
        timing: 'ON_ANNOUNCEMENT',
      },
    })
  })

  it('keeps interview-on final-result path separate', async () => {
    customInstanceMock.mockResolvedValue({ applicationId: 1, toStatus: 'APPROVED' })
    await submitVolunteerFinalResultRemote('1', { result: 'PASS', reason: '합격' })
    expect(customInstanceMock.mock.calls[0]?.[0].url).toBe(
      '/api/admin/volunteer-applications/1/final-result'
    )
  })
})

describe('volunteer approval without education scope', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
  })

  it('posts final-results/bulk PASS without filling schedule ids', async () => {
    customInstanceMock.mockResolvedValue({
      successCount: 4,
      failureCount: 0,
      successIds: [1691680, 1691679, 1691678, 1691677],
    })
    await bulkVolunteerFinalResultsRemote({
      ids: [1691680, 1691679, 1691678, 1691677],
      result: 'PASS',
    })
    expect(customInstanceMock.mock.calls[0]?.[0]).toEqual({
      url: '/api/admin/volunteer-applications/final-results/bulk',
      method: 'POST',
      data: {
        ids: [1691680, 1691679, 1691678, 1691677],
        result: 'PASS',
      },
    })
  })
})
