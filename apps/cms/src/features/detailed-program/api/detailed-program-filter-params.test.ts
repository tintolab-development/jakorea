import { describe, expect, it } from 'vitest'
import {
  detailedProgramsParamsFromSearchParams,
  serializeDetailedProgramListFilters,
} from './detailed-program-filter-params'

describe('detailed-program-filter-params', () => {
  it('maps usage URL params to API useYn', () => {
    expect(detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_use=active'))).toMatchObject({
      useYn: true,
      page: 0,
    })
    expect(
      detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_use=inactive'))
    ).toMatchObject({
      useYn: false,
    })
  })

  it('defaults missing dp_use to active (useYn true)', () => {
    const params = detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_name=워크숍'))
    expect(params.useYn).toBe(true)
    expect(params.keyword).toBe('워크숍')
  })

  it('serialize always includes default dp_use=active', () => {
    expect(serializeDetailedProgramListFilters(new URLSearchParams())).toBe('dp_use=active')
    expect(serializeDetailedProgramListFilters(new URLSearchParams('dp_name=워크숍'))).toBe(
      'dp_use=active&dp_name=%EC%9B%8C%ED%81%AC%EC%88%8D'
    )
  })

  it('ignores non-filter URL params so the list key stays stable', () => {
    const filtersOnly = new URLSearchParams('dp_use=active&dp_name=워크숍')
    const withExtra = new URLSearchParams('foo=bar&dp_use=active&dp_name=워크숍')
    expect(serializeDetailedProgramListFilters(withExtra)).toBe(
      serializeDetailedProgramListFilters(filtersOnly)
    )
  })
})
