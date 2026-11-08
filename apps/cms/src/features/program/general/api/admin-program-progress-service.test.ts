import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchProgramParticipantsRemote: vi.fn(),
  fetchOrganizationApplicationsRemote: vi.fn(),
  fetchOrganizationApplicationRequestedSchedulesRemote: vi.fn(),
}))

vi.mock('@/features/program/general/api/program-progress-remote-capabilities', () => ({
  shouldUseProgramProgressHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/program-progress-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchProgramParticipantsRemote: mocks.fetchProgramParticipantsRemote,
}))

vi.mock('@/features/program/general/api/applications-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchOrganizationApplicationsRemote: mocks.fetchOrganizationApplicationsRemote,
  fetchOrganizationApplicationRequestedSchedulesRemote:
    mocks.fetchOrganizationApplicationRequestedSchedulesRemote,
}))

import { fetchGeneralParticipatingInstitutionsPage } from './admin-program-progress-service'

describe('fetchGeneralParticipatingInstitutionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls only participants per page and maps requestedSchedules from the row', async () => {
    mocks.fetchProgramParticipantsRemote.mockResolvedValue({
      items: [
        {
          participantId: 1,
          organizationApplicationId: 501,
          organizationName: '기간형초',
          sessions: [],
          requestedSchedules: [
            {
              id: 99452,
              preferenceOrder: 1,
              requestedDate: '2026-11-18',
              startPeriod: 1,
              sessionCount: 1,
              combinedClassYn: false,
              sessionTimes: [],
              resolvedScheduleId: null,
              resolvedScheduleIds: [],
            },
          ],
        },
        {
          participantId: 2,
          organizationApplicationId: 502,
          organizationName: '희망없음초',
          sessions: [],
          requestedSchedules: [],
        },
      ],
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
    })

    const result = await fetchGeneralParticipatingInstitutionsPage('186500', 0)

    expect(mocks.fetchProgramParticipantsRemote).toHaveBeenCalledTimes(1)
    expect(mocks.fetchProgramParticipantsRemote).toHaveBeenCalledWith('186500', {
      page: 0,
      size: 20,
      participantType: 'ORGANIZATION',
    })
    expect(mocks.fetchOrganizationApplicationsRemote).not.toHaveBeenCalled()
    expect(mocks.fetchOrganizationApplicationRequestedSchedulesRemote).not.toHaveBeenCalled()

    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]?.hopeEducationSessions?.[0]?.requestedScheduleId).toBe(99452)
    expect(result.rows[0]?.lectureRound).toBe('1')
    expect(result.rows[1]?.hopeEducationSessions).toBeUndefined()
  })
})
