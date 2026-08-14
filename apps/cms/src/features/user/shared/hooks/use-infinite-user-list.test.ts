import { describe, expect, it } from 'vitest'
import type { InfiniteData } from '@tanstack/react-query'
import { keepFirstInfiniteQueryPage } from './use-infinite-user-list'

describe('keepFirstInfiniteQueryPage', () => {
  it('페이지가 하나면 그대로 둔다', () => {
    const data: InfiniteData<number> = { pages: [0], pageParams: [0] }
    expect(keepFirstInfiniteQueryPage(data)).toBe(data)
  })

  it('재진입 시 2페이지 이상 캐시는 첫 페이지만 남긴다', () => {
    const data: InfiniteData<number> = { pages: [0, 1, 2], pageParams: [0, 1, 2] }
    expect(keepFirstInfiniteQueryPage(data)).toEqual({
      pages: [0],
      pageParams: [0],
    })
  })
})
