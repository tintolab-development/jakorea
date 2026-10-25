import { describe, expect, it } from 'vitest'
import {
  toCategoryBatchChangesRequest,
} from './category-bulk-api'

describe('category bulk API request mapping', () => {
  it('maps create/update/delete into the backend DTO and preserves ISO versions', () => {
    expect(
      toCategoryBatchChangesRequest({
        creates: [
          {
            clientKey: 'new-1',
            name: '새 카테고리',
            status: 'enabled',
            displayOrder: null,
          },
        ],
        updates: [
          {
            id: '12',
            name: '수정한 카테고리',
            status: 'disabled',
            displayOrder: 4,
            expectedUpdatedAt: '2026-10-25T06:00:00Z',
          },
        ],
        deleteItems: [{ id: '13', expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
      })
    ).toEqual({
      creates: [
        {
          clientKey: 'new-1',
          name: '새 카테고리',
          status: 'enabled',
          displayOrder: null,
        },
      ],
      updates: [
        {
          id: 12,
          name: '수정한 카테고리',
          status: 'disabled',
          displayOrder: 4,
          expectedUpdatedAt: '2026-10-25T06:00:00Z',
        },
      ],
      deleteItems: [{ id: 13, expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
    })
  })

  it('does not invent an expectedUpdatedAt when the list did not provide one', () => {
    expect(() =>
      toCategoryBatchChangesRequest({
        creates: [],
        updates: [
          {
            id: '12',
            name: '수정',
            status: 'enabled',
            displayOrder: null,
            expectedUpdatedAt: null,
          },
        ],
        deleteItems: [],
      })
    ).toThrow('최신 수정 시각을 확인하지 못했습니다')
  })

  it('rejects non-numeric server ids before making a request', () => {
    expect(() =>
      toCategoryBatchChangesRequest({
        creates: [],
        updates: [],
        deleteItems: [{ id: 'temp-1', expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
      })
    ).toThrow('카테고리 ID가 올바르지 않습니다')
  })
})
