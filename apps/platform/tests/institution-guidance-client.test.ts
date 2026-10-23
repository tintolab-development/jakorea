import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('../src/shared/api/axios-instance', () => ({
  axiosClient: { post },
}))

import { confirmUjatTemporarySchedule } from '../src/features/mypage/education/applications/api/institution-guidance-client'

describe('confirmUjatTemporarySchedule', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('R105: revision이 유효하지 않으면 POST를 호출하지 않는다', async () => {
    await expect(
      confirmUjatTemporarySchedule('1691467', { assignmentRevision: Number.NaN }),
    ).rejects.toThrow('확인한 배정 revision이 유효하지 않습니다.')
    expect(post).not.toHaveBeenCalled()
  })

  it('유효한 revision이면 assignmentRevision을 body에 포함한다', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: { portalBannerState: 'ADMIN_REVIEW' } } })
    await confirmUjatTemporarySchedule('1691467', { assignmentRevision: 1 })
    expect(post).toHaveBeenCalledWith(
      '/api/portal/me/program-applications/1691467/ujat/temporary-schedule/confirm',
      { assignmentRevision: 1 },
    )
  })
})
