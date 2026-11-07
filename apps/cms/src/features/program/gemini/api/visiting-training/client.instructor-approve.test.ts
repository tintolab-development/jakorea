import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import { approveGeminiInstructorApplicationRemote } from './client'

describe('Gemini 강사 승인 remote client', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({})
  })

  it('Gemini 전용 강사 승인 path에 application id를 전달한다', async () => {
    await approveGeminiInstructorApplicationRemote('1691631')

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/instructor-applications/1691631/approve',
      method: 'POST',
    })
  })

  it('강사 변경이면 replacement=true body를 전달한다', async () => {
    await approveGeminiInstructorApplicationRemote('1694824', { replacement: true })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/gemini/trainings/instructor-applications/1694824/approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { replacement: true },
    })
  })
})
