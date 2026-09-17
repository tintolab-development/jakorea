import { describe, expect, it } from 'vitest'
import { shouldRetryCompanySchoolQuery } from './errors'

describe('company-school API policy', () => {
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
