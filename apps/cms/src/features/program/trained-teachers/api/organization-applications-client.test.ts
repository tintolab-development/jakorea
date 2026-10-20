import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  approveTrainedTeacherOrganizationApplicationRemote,
  giveUpTrainedTeacherOrganizationApplicationRemote,
} from './organization-applications-client'

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

describe('approveTrainedTeacherOrganizationApplicationRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
    vi.mocked(customInstance).mockResolvedValue({})
  })

  it('선택 일정·알림 timing을 교육받은 교사 승인 API에 전달한다', async () => {
    await approveTrainedTeacherOrganizationApplicationRemote('168006', '928514', {
      selectedScheduleId: 187134,
      timing: 'SCHEDULED',
      scheduledAt: '2026-04-19T09:00:00+09:00',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168006/trained-teacher/organization-applications/928514/approve',
      method: 'POST',
      data: {
        selectedScheduleId: 187134,
        timing: 'SCHEDULED',
        scheduledAt: '2026-04-19T09:00:00+09:00',
      },
    })
  })

  it('기간형 희망 순위 payload와 배정 상태 응답을 전달한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1691437,
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      scheduleAssignmentStatus: 'ASSIGNED',
    })

    await expect(
      approveTrainedTeacherOrganizationApplicationRemote('186263', '1691437', {
        timing: 'IMMEDIATE',
        preferredScheduleRank: 1,
      })
    ).resolves.toMatchObject({ scheduleAssignmentStatus: 'ASSIGNED' })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/186263/trained-teacher/organization-applications/1691437/approve',
      method: 'POST',
      data: {
        timing: 'IMMEDIATE',
        preferredScheduleRank: 1,
      },
    })
  })

  it('payload가 없으면 기존 무본문 승인 요청을 보낸다', async () => {
    await approveTrainedTeacherOrganizationApplicationRemote('168006', '928514')

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168006/trained-teacher/organization-applications/928514/approve',
      method: 'POST',
    })
  })
})
