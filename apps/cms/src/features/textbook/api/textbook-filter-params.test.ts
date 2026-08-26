import { describe, expect, it } from 'vitest'
import {
  parseTextbookUseStatus,
  textbooksParamsFromFilters,
  type TextbookListFilters,
} from './textbook-filter-params'

const empty: TextbookListFilters = {
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: 'ALL',
  textbookName: '',
  useStatus: 'USED',
}

describe('textbook-filter-params', () => {
  it('always sends useStatus and optional grade/textbookName', () => {
    expect(
      textbooksParamsFromFilters({
        ...empty,
        grade: '초등 3학년',
        textbookName: '경제',
      })
    ).toMatchObject({
      useStatus: 'USED',
      grade: '초등 3학년',
      textbookName: '경제',
    })
  })

  it('omits ALL/empty filters but keeps useStatus', () => {
    const params = textbooksParamsFromFilters(empty)
    expect(params.useStatus).toBe('USED')
    expect(params.grade).toBeUndefined()
    expect(params.textbookName).toBeUndefined()
    expect(params.businessArea).toBeUndefined()
  })

  it('defaults missing tb_use to USED', () => {
    expect(parseTextbookUseStatus(null)).toBe('USED')
    expect(parseTextbookUseStatus('UNUSED')).toBe('UNUSED')
    expect(parseTextbookUseStatus('USED')).toBe('USED')
  })
})
