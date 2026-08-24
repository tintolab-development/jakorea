import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/posts/api/notices/notices-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/posts/api/notices/notices-api-client')>()
  return {
    ...actual,
    createNoticeCategoryRemote: vi.fn(),
  }
})

import { createNoticeCategoryRemote } from '@/features/posts/api/notices/notices-api-client'
import { createNoticeCategory } from './admin-notices-service'

const createNoticeCategoryRemoteMock = vi.mocked(createNoticeCategoryRemote)

describe('createNoticeCategory', () => {
  beforeEach(() => {
    createNoticeCategoryRemoteMock.mockReset()
  })

  it('maps a single-object POST body so mutation onSuccess can sync the cache', async () => {
    createNoticeCategoryRemoteMock.mockResolvedValue({
      id: 'cat-3',
      categoryName: '신규 카테고리',
      status: 'active',
    })

    await expect(createNoticeCategory('신규 카테고리')).resolves.toEqual({
      id: 'cat-3',
      name: '신규 카테고리',
    })
    expect(createNoticeCategoryRemoteMock).toHaveBeenCalledWith({
      categoryName: '신규 카테고리',
      name: '신규 카테고리',
      status: 'active',
    })
  })

  it('does not throw when the create payload has no mappable row', async () => {
    createNoticeCategoryRemoteMock.mockResolvedValue(null)

    await expect(createNoticeCategory('신규')).resolves.toBeNull()
  })
})
