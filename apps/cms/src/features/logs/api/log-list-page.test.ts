import { describe, expect, it } from 'vitest'
import {
  LOG_LIST_MAX_PAGE_SIZE,
  LOG_LIST_PAGE_SIZE,
  clampLogListPageSize,
  paginateLogList,
} from './log-list-page'

describe('log-list-page', () => {
  it('clamps size to 1..100 with default 20', () => {
    expect(clampLogListPageSize()).toBe(LOG_LIST_PAGE_SIZE)
    expect(clampLogListPageSize(0)).toBe(1)
    expect(clampLogListPageSize(101)).toBe(LOG_LIST_MAX_PAGE_SIZE)
    expect(clampLogListPageSize(50)).toBe(50)
  })

  it('paginates a local list with totalElements and hasNext', () => {
    const items = Array.from({ length: 45 }, (_, i) => i)
    const page0 = paginateLogList(items, 0, 20)
    expect(page0.items).toEqual(items.slice(0, 20))
    expect(page0.totalElements).toBe(45)
    expect(page0.totalPages).toBe(3)
    expect(page0.hasNext).toBe(true)

    const page2 = paginateLogList(items, 2, 20)
    expect(page2.items).toEqual(items.slice(40, 45))
    expect(page2.hasNext).toBe(false)
  })
})
