import { describe, expect, it } from 'vitest'
import { findGeminiDuplicateRowIndexes } from './import-result-duplicates'

describe('findGeminiDuplicateRowIndexes', () => {
  it('uses the 1-based rowNumber from the remote preview', () => {
    expect(
      findGeminiDuplicateRowIndexes(
        [
          { rowNumber: 1, duplicate: false },
          { rowNumber: 2, duplicate: true },
          { rowNumber: 3, duplicate: true },
        ],
        3
      )
    ).toEqual([1, 2])
  })

  it('falls back to the response order when rowNumber is omitted', () => {
    expect(
      findGeminiDuplicateRowIndexes(
        [{ duplicate: false }, { duplicate: true }, { duplicate: false }],
        3
      )
    ).toEqual([1])
  })

  it('falls back to response order for an invalid rowNumber', () => {
    expect(
      findGeminiDuplicateRowIndexes(
        [{ rowNumber: 99, duplicate: true }, { rowNumber: 2, duplicate: true }],
        2
      )
    ).toEqual([0, 1])
  })
})
