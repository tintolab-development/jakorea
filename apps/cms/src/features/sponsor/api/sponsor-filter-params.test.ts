import { describe, expect, it } from 'vitest'
import { serializeSponsorListFilters } from './sponsor-filter-params'

describe('serializeSponsorListFilters', () => {
  it('ignores detail overlay params so open/close detail keeps the same list key', () => {
    const filtersOnly = new URLSearchParams('sp_kind=corporate&sp_st=active')
    const withOverlay = new URLSearchParams(
      'sp_kind=corporate&sp_st=active&sponsorId=sp-1&sponsorLnb=sponsor-detail&returnTo=%2Fprograms'
    )
    expect(serializeSponsorListFilters(withOverlay)).toBe(serializeSponsorListFilters(filtersOnly))
  })

  it('keeps filter params in a stable order', () => {
    const shuffled = new URLSearchParams('sp_st=ended&sp_mgr=김&sp_name=우리&sp_kind=foundation')
    expect(serializeSponsorListFilters(shuffled)).toBe(
      'sp_kind=foundation&sp_name=%EC%9A%B0%EB%A6%AC&sp_mgr=%EA%B9%80&sp_st=ended'
    )
  })

  it('omits ALL/empty filters', () => {
    expect(serializeSponsorListFilters(new URLSearchParams('sponsorId=sp-1'))).toBe('')
    expect(serializeSponsorListFilters(new URLSearchParams('sp_kind=ALL&sp_name=%20'))).toBe('')
  })
})
