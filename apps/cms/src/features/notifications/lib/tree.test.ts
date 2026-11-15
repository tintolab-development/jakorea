import { describe, expect, it } from 'vitest'
import {
  collectExplicitDeleteIds,
  firstTemplateInCategory,
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

describe('firstTemplateInCategory', () => {
  const categories = [
    { id: '1', name: 'Root folder', parentId: 'root' },
    { id: '2', name: 'Child', parentId: '1' },
    { id: '3', name: 'Empty child', parentId: '1' },
    { id: '4', name: 'Empty folder', parentId: 'root' },
  ]
  const templates = [
    { id: '10', name: 'A', templateName: 'A', categoryId: '1' },
    { id: '11', name: 'B', templateName: 'B', categoryId: '2' },
    { id: '12', name: 'C', templateName: 'C', categoryId: '2' },
  ]

  it('트리 표시 순서(하위 폴더 먼저, 깊이 우선)의 첫 템플릿을 고른다', () => {
    expect(firstTemplateInCategory(categories, templates, '1')?.id).toBe('11')
    expect(firstTemplateInCategory(categories, templates, '2')?.id).toBe('11')
    expect(firstTemplateInCategory(categories, templates, 'root')?.id).toBe('11')
  })

  it('하위 폴더가 비어 있으면 다음 항목으로 넘어간다', () => {
    const onlyDirect = templates.filter(template => template.categoryId === '1')
    expect(firstTemplateInCategory(categories, onlyDirect, '1')?.id).toBe('10')
  })

  it('템플릿이 하나도 없는 폴더는 undefined', () => {
    expect(firstTemplateInCategory(categories, templates, '3')).toBeUndefined()
    expect(firstTemplateInCategory(categories, templates, '4')).toBeUndefined()
  })
})
