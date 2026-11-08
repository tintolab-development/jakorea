import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  approveGeminiOrganizationApplicationRemote,
  bulkApproveGeminiOrganizationApplicationsRemote,
} from './client'

describe('approveGeminiOrganizationApplicationRemote', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({})
  })

  it('Gemini 전용 approve path 로 빈 body 즉시 발송한다', async () => {
    await approveGeminiOrganizationApplicationRemote('1691535', { timing: 'IMMEDIATE' })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/organization-applications/1691535/approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })
  })

  it('알림 직접 설정은 SCHEDULED + scheduledAt 만 보낸다', async () => {
    await approveGeminiOrganizationApplicationRemote('1691535', {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/organization-applications/1691535/approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-29T03:00:00.000Z',
      },
    })
    expect(customInstanceMock.mock.calls[0]?.[0].data).not.toHaveProperty(
      'preferredScheduleRank'
    )
  })

  it('공통 organization-applications approve path 를 쓰지 않는다', async () => {
    await approveGeminiOrganizationApplicationRemote('1691535')
    const url = String(customInstanceMock.mock.calls[0]?.[0].url)
    expect(url).not.toBe('/api/admin/organization-applications/1691535/approve')
  })
})

describe('bulkApproveGeminiOrganizationApplicationsRemote', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({ data: { successIds: [1691535, 1691536] } })
  })

  it('일괄 즉시 승인은 ids 만 보낸다', async () => {
    await bulkApproveGeminiOrganizationApplicationsRemote([1691535, 1691536])

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/organization-applications/bulk-approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { ids: [1691535, 1691536] },
    })
  })

  it('일괄 직접 설정은 SCHEDULED + scheduledAt 을 보낸다', async () => {
    await bulkApproveGeminiOrganizationApplicationsRemote([1691535, 1691536], {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/organization-applications/bulk-approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        ids: [1691535, 1691536],
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-29T03:00:00.000Z',
      },
    })
  })
})
