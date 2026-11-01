import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/shared/api', () => ({
  axiosClient: {
    post: (...args: unknown[]) => post(...args),
  },
}))

import { fetchMemberPrivacyUnmask } from './privacy-unmask-fetcher'

describe('fetchMemberPrivacyUnmask', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('POST /api/admin/users/{id}/privacy/unmask 를 호출하고 data를 반환한다', async () => {
    post.mockResolvedValue({
      data: { success: true, data: { phone: '010-1111-2222' } },
    })
    await expect(fetchMemberPrivacyUnmask('190001', '확인')).resolves.toEqual({
      phone: '010-1111-2222',
    })
    expect(post).toHaveBeenCalledWith('/api/admin/users/190001/privacy/unmask', {
      reason: '확인',
    })
  })
})
