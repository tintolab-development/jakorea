import { describe, expect, it } from 'vitest'
import { shouldRetryQuery } from './errors'
import { toRemoteListParams } from './list-params'

describe('ujat API policy', () => {
  it('always scopes list requests to UJAT with default page size 500', () => {
    expect(toRemoteListParams({ keyword: ' 서울 ', businessYear: 2026 })).toEqual({
      keyword: ' 서울 ',
      businessYear: 2026,
      programType: 'UJAT',
      page: 0,
      size: 500,
    })
  })

  it('does not retry 4xx queries', () => {
    expect(shouldRetryQuery(0, { response: { status: 404 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 500 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 500 } })).toBe(false)
  })
})
