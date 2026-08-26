import { describe, expect, it } from 'vitest'
import { keepFirstInfiniteQueryPage } from './use-infinite-log-list'

describe('keepFirstInfiniteQueryPage', () => {
  it('returns data with a single page unchanged', () => {
    const data = { pages: [{ items: [1] }], pageParams: [0] }
    expect(keepFirstInfiniteQueryPage(data)).toBe(data)
  })

  it('drops cached pages after the first', () => {
    const data = {
      pages: [{ items: [1] }, { items: [2] }],
      pageParams: [0, 1],
    }
    expect(keepFirstInfiniteQueryPage(data)).toEqual({
      pages: [{ items: [1] }],
      pageParams: [0],
    })
  })
})
