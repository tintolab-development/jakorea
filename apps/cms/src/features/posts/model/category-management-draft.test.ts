import { describe, expect, it } from 'vitest'
import {
  buildCategoryManagementDraftChanges,
  hasCategoryManagementDraftChanges,
  validateCategoryName,
} from './category-management-draft'
import { hasDuplicateCategoryName } from './notice-category-domain'

describe('category-management-draft', () => {
  it.each(['한글', 'Notice_01', '공지-01'])('allows %s', value => {
    expect(validateCategoryName(value)).toBe('valid')
  })

  it.each(['', '   '])('rejects empty category names: %j', value => {
    expect(validateCategoryName(value)).toBe('empty')
  })

  it.each(['공지사항!', '카테고리 이름', '공지/FAQ'])('rejects unsupported characters: %j', value => {
    expect(validateCategoryName(value)).toBe('invalid_characters')
  })

  it('matches the backend case-insensitive duplicate rule', () => {
    expect(hasDuplicateCategoryName([{ id: '1', name: 'Notice' }], 'notice')).toBe(true)
    expect(hasDuplicateCategoryName([{ id: '1', name: 'Notice' }], 'notices')).toBe(false)
  })

  it('builds create, update, and delete changes without mutating the server baseline', () => {
    const base = [
      {
        id: '1',
        name: '공지',
        updatedAt: '2026-10-25T06:00:00Z',
        useYn: true,
        displayOrder: 3,
      },
      { id: '2', name: 'FAQ', updatedAt: '2026-10-25T06:01:00Z' },
    ]
    const draft = [
      { id: '1', name: '공지사항' },
      { id: 'temp-1', name: '새 카테고리' },
    ]

    expect(buildCategoryManagementDraftChanges(base, draft)).toEqual({
      creates: [
        {
          clientKey: 'temp-1',
          name: '새 카테고리',
          status: 'enabled',
          displayOrder: null,
        },
      ],
      updates: [
        {
          id: '1',
          name: '공지사항',
          status: 'enabled',
          displayOrder: 3,
          expectedUpdatedAt: '2026-10-25T06:00:00Z',
        },
      ],
      deleteItems: [{ id: '2', expectedUpdatedAt: '2026-10-25T06:01:00Z' }],
    })
  })

  it('recognizes a no-op draft', () => {
    const changes = buildCategoryManagementDraftChanges(
      [{ id: '1', name: '공지' }],
      [{ id: '1', name: '공지' }]
    )
    expect(hasCategoryManagementDraftChanges(changes)).toBe(false)
  })
})
