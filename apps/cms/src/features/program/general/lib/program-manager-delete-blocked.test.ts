import { describe, expect, it } from 'vitest'
import { isProgramManagerDeleteBlocked } from './program-manager-delete-blocked'

describe('isProgramManagerDeleteBlocked', () => {
  it('담당자가 1명이면 선택과 무관하게 막는다', () => {
    expect(
      isProgramManagerDeleteBlocked({ totalManagerCount: 1, selectedCount: 0, filtersActive: false })
    ).toBe(true)
    expect(
      isProgramManagerDeleteBlocked({ totalManagerCount: 1, selectedCount: 1, filtersActive: false })
    ).toBe(true)
  })

  it('전원을 선택하면 막고, 일부만 선택하면 허용한다', () => {
    expect(
      isProgramManagerDeleteBlocked({ totalManagerCount: 3, selectedCount: 3, filtersActive: false })
    ).toBe(true)
    expect(
      isProgramManagerDeleteBlocked({ totalManagerCount: 3, selectedCount: 2, filtersActive: false })
    ).toBe(false)
  })

  it('필터가 적용된 목록에서는 판단하지 않는다', () => {
    expect(
      isProgramManagerDeleteBlocked({ totalManagerCount: 1, selectedCount: 1, filtersActive: true })
    ).toBe(false)
  })
})
