import { describe, expect, it } from 'vitest'
import {
  collectExplicitDeleteIds,
  sortCategoryIdsDeepestFirst,
} from './tree'

describe('collectExplicitDeleteIds', () => {
  const categories = [
    { id: '1', name: 'Root folder', parentId: 'root' },
    { id: '2', name: 'Child', parentId: '1' },
    { id: 'unclassified-root', name: '미분류', parentId: 'root' },
  ]
  const templates = [
    { id: '10', name: 'A', templateName: 'A', categoryId: '1' },
    { id: '11', name: 'B', templateName: 'B', categoryId: '2' },
  ]

  it('체크한 항목만 포함하고 미분류·루트는 제외한다', () => {
    const result = collectExplicitDeleteIds(
      categories,
      templates,
      new Set(['10', '1', 'unclassified-root', 'root'])
    )
    expect(result.templateIds).toEqual(['10'])
    expect(result.categoryIds).toEqual(['1'])
  })

  it('카테고리는 깊은 노드부터 정렬한다', () => {
    expect(sortCategoryIdsDeepestFirst(categories, ['1', '2'])).toEqual(['2', '1'])
  })
})
