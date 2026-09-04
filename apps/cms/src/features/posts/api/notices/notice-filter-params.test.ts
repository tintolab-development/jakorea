import { describe, expect, it } from 'vitest'
import { noticesParamsFromSearchParams } from './notice-filter-params'

describe('noticesParamsFromSearchParams', () => {
  it('sends visibility and omits empty optional filters', () => {
    expect(noticesParamsFromSearchParams(new URLSearchParams())).toEqual({
      page: 0,
      size: 500,
      visibility: 'public',
    })
  })

  it('maps URL filter keys to server query params', () => {
    const params = noticesParamsFromSearchParams(
      new URLSearchParams(
        'an_vis=private&an_q=점검&an_auth=관리자&an_cat=서비스 안내&an_from=2026-01-01&an_to=2026-01-31'
      )
    )
    expect(params).toEqual({
      page: 0,
      size: 500,
      visibility: 'private',
      title: '점검',
      author: '관리자',
      category: '서비스 안내',
      createdFrom: '2026-01-01',
      createdTo: '2026-01-31',
    })
  })

  it('does not send ALL category', () => {
    const params = noticesParamsFromSearchParams(new URLSearchParams('an_cat=ALL'))
    expect(params.category).toBeUndefined()
  })
})
