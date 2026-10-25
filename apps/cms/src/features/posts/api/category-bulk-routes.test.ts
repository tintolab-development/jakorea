import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customInstance } from '@/shared/api/orval-mutator'
import { bulkChangeFaqCategoriesRemote } from './faqs/faqs-api-client'
import { bulkChangeInquiryCategoriesRemote } from './inquiries/inquiries-api-client'
import { bulkChangeNoticeCategoriesRemote } from './notices/notices-api-client'
import type { CategoryManagementDraftChanges } from '../model/category-management-draft'

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(),
}))

const customInstanceMock = vi.mocked(customInstance)

const changes: CategoryManagementDraftChanges = {
  creates: [
    {
      clientKey: 'new-1',
      name: '신규',
      status: 'enabled',
      displayOrder: null,
    },
  ],
  updates: [
    {
      id: '12',
      name: '수정',
      status: 'enabled',
      displayOrder: 2,
      expectedUpdatedAt: '2026-10-25T06:00:00Z',
    },
  ],
  deleteItems: [{ id: '13', expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
}

const response = {
  items: [],
  created: [],
  updatedIds: [12],
  deletedIds: [13],
  revision: 'r-1',
}

describe('category bulk endpoint adapters', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    customInstanceMock.mockResolvedValue({ success: true, data: response } as never)
  })

  it.each([
    [bulkChangeNoticeCategoriesRemote, '/api/admin/content/notice-categories/bulk-changes'],
    [bulkChangeFaqCategoriesRemote, '/api/admin/content/faq-categories/bulk-changes'],
    [bulkChangeInquiryCategoriesRemote, '/api/admin/inquiry-categories/bulk-changes'],
  ])('uses one PATCH request for %s', async (bulkChange, url) => {
    await expect(bulkChange(changes)).resolves.toEqual(response)

    expect(customInstanceMock).toHaveBeenCalledTimes(1)
    expect(customInstanceMock).toHaveBeenCalledWith({
      url,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: {
        creates: [
          {
            clientKey: 'new-1',
            name: '신규',
            status: 'enabled',
            displayOrder: null,
          },
        ],
        updates: [
          {
            id: 12,
            name: '수정',
            status: 'enabled',
            displayOrder: 2,
            expectedUpdatedAt: '2026-10-25T06:00:00Z',
          },
        ],
        deleteItems: [{ id: 13, expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
      },
    })
  })
})
