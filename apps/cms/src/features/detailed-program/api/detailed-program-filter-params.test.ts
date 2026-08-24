import { describe, expect, it } from 'vitest'
import { detailedProgramsParamsFromSearchParams, serializeDetailedProgramListFilters } from './detailed-program-filter-params'

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

  it('omits useYn when usage is ALL', () => {
    const params = detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_name=워크숍'))
    expect(params.useYn).toBeUndefined()
  })

  it('sends program name as keyword', () => {
    expect(
      detailedProgramsParamsFromSearchParams(new URLSearchParams('dp_name=워크숍'))
    ).toMatchObject({ keyword: '워크숍' })
  })

  it('ignores non-filter URL params so the list key stays stable', () => {
    const filtersOnly = new URLSearchParams('dp_use=active&dp_name=워크숍')
    const withExtra = new URLSearchParams('foo=bar&dp_use=active&dp_name=워크숍')
    expect(serializeDetailedProgramListFilters(withExtra)).toBe(
      serializeDetailedProgramListFilters(filtersOnly)
    )
  })
})
