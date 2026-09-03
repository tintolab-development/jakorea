import { describe, expect, it } from 'vitest'
import { faqsParamsFromSearchParams } from './faq-filter-params'

describe('faqsParamsFromSearchParams', () => {
  it('sends visibility and omits empty optional filters', () => {
    expect(faqsParamsFromSearchParams(new URLSearchParams())).toEqual({
      page: 0,
      size: 500,
      visibility: 'public',
    })
  })

  it('maps URL filter keys to server query params', () => {
    const params = faqsParamsFromSearchParams(
      new URLSearchParams(
        'af_vis=private&af_q=결제&af_auth=관리자&af_cat=이용안내&af_from=2026-01-01&af_to=2026-01-31'
      )
    )
    expect(params).toEqual({
      page: 0,
      size: 500,
      visibility: 'private',
      title: '결제',
      author: '관리자',
      category: '이용안내',
      createdFrom: '2026-01-01',
      createdTo: '2026-01-31',
    })
  })

  it('does not send ALL category', () => {
    const params = faqsParamsFromSearchParams(new URLSearchParams('af_cat=ALL'))
    expect(params.category).toBeUndefined()
  })
})
