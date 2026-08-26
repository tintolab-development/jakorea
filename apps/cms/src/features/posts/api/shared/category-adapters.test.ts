import { describe, expect, it } from 'vitest'
import {
  mapCreatedCategory,
  withCreatedCategory,
  withoutCategory,
  withRenamedCategory,
} from './category-adapters'

describe('mapCreatedCategory', () => {
  it('maps a single-object create response (ApiResponse data)', () => {
    expect(
      mapCreatedCategory({
        id: 12,
        categoryName: '신규',
        status: 'active',
      })
    ).toEqual({ id: '12', name: '신규' })
  })

  it('maps page-shaped create response items by name', () => {
    expect(
      mapCreatedCategory(
        {
          items: [
            { id: 'a', categoryName: '기존' },
            { id: 'b', name: '신규' },
          ],
        },
        '신규'
      )
    ).toEqual({ id: 'b', name: '신규' })
  })

  it('uses fallback name when only id is present', () => {
    expect(mapCreatedCategory({ categoryId: 'c-9' }, '  안내  ')).toEqual({
      id: 'c-9',
      name: '안내',
    })
  })

  it('returns null for empty payloads so mutation can still invalidate', () => {
    expect(mapCreatedCategory(null)).toBeNull()
    expect(mapCreatedCategory({})).toBeNull()
  })
})

describe('category list cache helpers', () => {
  it('appends a created row without duplicating id', () => {
    const existing = [{ id: '1', name: '공지' }]
    expect(withCreatedCategory(existing, { id: '2', name: '안내' })).toEqual([
      { id: '1', name: '공지' },
      { id: '2', name: '안내' },
    ])
    expect(withCreatedCategory(existing, { id: '1', name: '공지' })).toEqual(existing)
  })

  it('renames and removes by id', () => {
    const rows = [
      { id: '1', name: '공지' },
      { id: '2', name: '안내' },
    ]
    expect(withRenamedCategory(rows, '2', '이벤트')).toEqual([
      { id: '1', name: '공지' },
      { id: '2', name: '이벤트' },
    ])
    expect(withoutCategory(rows, '1')).toEqual([{ id: '2', name: '안내' }])
  })
})
