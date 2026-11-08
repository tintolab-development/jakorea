import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  approveGeminiInstructorApplicationRemote,
  fetchGeminiInstructorApplicationDetailRemote,
} from './client'

describe('Gemini 강사 승인 remote client', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({})
  })

  it('Gemini 전용 강사 승인 path에 즉시 알림 계약을 전달한다', async () => {
    await approveGeminiInstructorApplicationRemote('1691631')

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/instructor-applications/1691631/approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { timing: 'IMMEDIATE', scheduledAt: null },
    })
  })

  it('강사 변경도 replacement 없이 알림 시점만 전달한다', async () => {
    await approveGeminiInstructorApplicationRemote('1694824', {
      timing: 'SCHEDULED',
      scheduledAt: '2026-09-15T05:41:00.000Z',
    })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/instructor-applications/1694824/approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { timing: 'SCHEDULED', scheduledAt: '2026-09-15T05:41:00.000Z' },
    })
  })

  it('승인 연수와 신청 ID를 함께 사용하는 scoped detail path를 호출한다', async () => {
    await fetchGeminiInstructorApplicationDetailRemote('186408', '1695001')

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/approved/186408/instructor-applications/1695001',
      method: 'GET',
    })
  })
})
