import { describe, expect, it } from 'vitest'
import { getNextGeneralProgramPageParam } from './general-program-list-query'

describe('getNextGeneralProgramPageParam', () => {
  it('0-based page 응답에서 다음 페이지를 1로 요청한다', () => {
    expect(
      getNextGeneralProgramPageParam({
        programs: [],
        page: 0,
        size: 20,
        totalElements: 27,
        hasMore: true,
      })
    ).toBe(1)
  })

  it('마지막 페이지에서는 추가 요청을 만들지 않는다', () => {
    expect(
      getNextGeneralProgramPageParam({
        programs: [],
        page: 1,
        size: 20,
        totalElements: 27,
        hasMore: false,
      })
    ).toBeUndefined()
  })
})
