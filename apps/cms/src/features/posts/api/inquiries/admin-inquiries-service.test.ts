import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/posts/api/inquiries/inquiries-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/posts/api/inquiries/inquiries-api-client')>()
  return {
    ...actual,
    createInquiryCategoryRemote: vi.fn(),
    fetchInquiryCategoriesRemote: vi.fn(),
  }
})

import {
  createInquiryCategoryRemote,
  fetchInquiryCategoriesRemote,
} from '@/features/posts/api/inquiries/inquiries-api-client'
import { createInquiryCategory, getInquiryCategories } from './admin-inquiries-service'

const createInquiryCategoryRemoteMock = vi.mocked(createInquiryCategoryRemote)
const fetchInquiryCategoriesRemoteMock = vi.mocked(fetchInquiryCategoriesRemote)

describe('getInquiryCategories', () => {
  beforeEach(() => {
    fetchInquiryCategoriesRemoteMock.mockReset()
  })

  it('maps page items with categoryName/id aliases', async () => {
    fetchInquiryCategoriesRemoteMock.mockResolvedValue({
      items: [
        { id: '1', categoryName: '계정' },
        { categoryId: '2', name: '프로그램' },
      ],
    })

    await expect(getInquiryCategories()).resolves.toEqual([
      { id: '1', name: '계정' },
      { id: '2', name: '프로그램' },
    ])
    expect(fetchInquiryCategoriesRemoteMock).toHaveBeenCalledWith({ page: 0, size: 100 })
  })
})

describe('createInquiryCategory', () => {
  beforeEach(() => {
    createInquiryCategoryRemoteMock.mockReset()
  })

  it('maps a single-object POST body so mutation onSuccess can sync the cache', async () => {
    createInquiryCategoryRemoteMock.mockResolvedValue({
      id: 'cat-3',
      categoryName: '신규 카테고리',
      status: 'active',
    })

    await expect(createInquiryCategory('신규 카테고리')).resolves.toEqual({
      id: 'cat-3',
      name: '신규 카테고리',
    })
    expect(createInquiryCategoryRemoteMock).toHaveBeenCalledWith({
      categoryName: '신규 카테고리',
      name: '신규 카테고리',
      status: 'active',
    })
  })

  it('returns null when OpenAPI POST has no body so cache can refetch', async () => {
    createInquiryCategoryRemoteMock.mockResolvedValue(undefined)

    await expect(createInquiryCategory('신규')).resolves.toBeNull()
  })
})
