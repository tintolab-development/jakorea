import { describe, expect, it } from 'vitest'
import { hasDuplicateBusinessAreaName } from './business-area-domain'

describe('business-area-domain', () => {
  it('detects duplicate names excluding self', () => {
    const rows = [
      { id: 'a', name: '경제금융', textbookCount: 0, deletable: true },
      { id: 'b', name: '진로취업', textbookCount: 2, deletable: false },
    ]
    expect(hasDuplicateBusinessAreaName(rows, '경제금융')).toBe(true)
    expect(hasDuplicateBusinessAreaName(rows, '경제금융', 'a')).toBe(false)
    expect(hasDuplicateBusinessAreaName(rows, '신규분야')).toBe(false)
  })
})
