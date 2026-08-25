import { describe, expect, it } from 'vitest'
import { textbooksParamsFromFilters, type TextbookListFilters } from './textbook-filter-params'

const empty: TextbookListFilters = {
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: 'ALL',
  textbookName: '',
  useStatus: 'ALL',
}

describe('textbook-filter-params', () => {
  it('sends grade and textbookName to the server', () => {
    expect(
      textbooksParamsFromFilters({
        ...empty,
        grade: '초등 3학년',
        textbookName: '경제',
      })
    ).toMatchObject({
      grade: '초등 3학년',
      textbookName: '경제',
    })
  })

  it('omits ALL/empty filters', () => {
    const params = textbooksParamsFromFilters(empty)
    expect(params.grade).toBeUndefined()
    expect(params.textbookName).toBeUndefined()
    expect(params.businessArea).toBeUndefined()
  })
})
