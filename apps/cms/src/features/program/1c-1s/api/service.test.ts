import { describe, expect, it } from 'vitest'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'
import { shouldRetryCompanySchoolQuery } from './errors'
import { companySchoolListParams } from './list-params'

describe('company-school API policy', () => {
  it('always scopes list requests to COMPANY_SCHOOL', () => {
    expect(companySchoolListParams({ keyword: ' 금융 ' })).toEqual({
      programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
      keyword: '금융',
      periodStatus: undefined,
      businessYear: undefined,
      page: 0,
      size: 500,
    })
  })

  it('does not retry 4xx queries', () => {
    expect(
      shouldRetryCompanySchoolQuery(0, { response: { status: 404 } })
    ).toBe(false)
    expect(
      shouldRetryCompanySchoolQuery(0, { response: { status: 500 } })
    ).toBe(true)
    expect(
      shouldRetryCompanySchoolQuery(2, { response: { status: 500 } })
    ).toBe(false)
  })
})
