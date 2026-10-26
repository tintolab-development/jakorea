import { describe, expect, it } from 'vitest'
import { toRemoteListParams } from './list-params'

describe('UJAT list params', () => {
  it('프로그램명 검색어와 진행년도를 원격 목록 계약으로 전달한다', () => {
    expect(
      toRemoteListParams({ keyword: '샘플 프로그램', businessYear: 2027, page: 1, size: 20 })
    ).toEqual({
      keyword: '샘플 프로그램',
      businessYear: 2027,
      programType: 'UJAT',
      page: 1,
      size: 20,
    })
  })

  it('검색어를 API query에 전달한다', () => {
    expect(toRemoteListParams({ keyword: '  ' })).toMatchObject({
      keyword: '  ',
      programType: 'UJAT',
    })
  })
})
