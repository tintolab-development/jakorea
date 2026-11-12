import { describe, expect, it } from 'vitest'
import {
  DETAILED_PROGRAM_API_PAGE_SIZE,
  detailedProgramsParamsFromSearchParams,
  serializeDetailedProgramListFilters,
} from './detailed-program-filter-params'

describe('detailed-program-filter-params', () => {
  it('maps usage URL params to API useYn', () => {
    expect(detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_use=active'))).toMatchObject({
      useYn: true,
      page: 0,
      size: DETAILED_PROGRAM_API_PAGE_SIZE,
    })
    expect(
      detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_use=inactive'))
    ).toMatchObject({
      useYn: false,
    })
  })

  it('defaults missing dp_use to 전체 (useYn omitted)', () => {
    const params = detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_name=워크숍'))
    expect(params.useYn).toBeUndefined()
    expect(params.keyword).toBe('워크숍')
  })

  it('serialize omits dp_use when 전체', () => {
    expect(serializeDetailedProgramListFilters(new URLSearchParams())).toBe('')
    expect(serializeDetailedProgramListFilters(new URLSearchParams('dp_name=워크숍'))).toBe(
      'dp_name=%EC%9B%8C%ED%81%AC%EC%88%8D'
    )
    expect(serializeDetailedProgramListFilters(new URLSearchParams('dp_use=active'))).toBe(
      'dp_use=active'
    )
  })

  it('ignores non-filter URL params so the list key stays stable', () => {
    const filtersOnly = new URLSearchParams('dp_use=active&dp_name=워크숍')
    const withExtra = new URLSearchParams('foo=bar&dp_use=active&dp_name=워크숍')
    expect(serializeDetailedProgramListFilters(withExtra)).toBe(
      serializeDetailedProgramListFilters(filtersOnly)
    )
  })

  it('sends program name as keyword', () => {
    expect(
      detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_name=워크숍'))
    ).toMatchObject({ keyword: '워크숍' })
  })
})
