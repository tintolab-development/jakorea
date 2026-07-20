import { describe, expect, it } from 'vitest'
import { detailedProgramsParamsFromSearchParams } from './detailed-program-filter-params'

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
})
