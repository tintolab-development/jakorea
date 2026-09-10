import { describe, expect, it } from 'vitest'
import { requireMutationCategoryTree } from './alimtalk-template-adapters'

describe('requireMutationCategoryTree', () => {
  const tree = { channelType: 'ALIMTALK', roots: [] }

  it('payload.tree를 읽는다', () => {
    expect(requireMutationCategoryTree({ templateId: 10, deleted: true, tree })).toEqual(tree)
  })

  it('payload.data.tree를 읽는다', () => {
    expect(requireMutationCategoryTree({ data: { categoryId: 1, created: true, tree } })).toEqual(
      tree
    )
  })

  it('tree가 없으면 MISSING_TREE', () => {
    expect(() => requireMutationCategoryTree({ templateId: 10, deleted: true })).toThrow(
      'MISSING_TREE'
    )
  })
})
