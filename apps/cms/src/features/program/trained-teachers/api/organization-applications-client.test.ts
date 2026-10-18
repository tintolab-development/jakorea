import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { giveUpTrainedTeacherOrganizationApplicationRemote } from './organization-applications-client'

describe('giveUpTrainedTeacherOrganizationApplicationRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('TT 기관 활동 포기 요청에 선택한 faultParty를 포함한다', async () => {
    const response = {
      applicationId: 928514,
      applicationStatus: 'APPROVED',
      activityWithdrawn: true,
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      giveUpTrainedTeacherOrganizationApplicationRemote('168006', '928514', {
        stopScheduleId: 928513,
        reason: '기관 사정으로 활동 포기',
        faultParty: 'USER',
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168006/trained-teacher/organization-applications/928514/give-up',
      method: 'POST',
      data: {
        stopScheduleId: 928513,
        reason: '기관 사정으로 활동 포기',
        faultParty: 'USER',
      },
      headers: { 'Content-Type': 'application/json' },
    })
  })
})
