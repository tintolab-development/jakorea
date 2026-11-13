import { describe, expect, it } from 'vitest'
import {
  parseTextbookUseStatus,
  textbooksParamsFromFilters,
  type TextbookListFilters,
} from './textbook-filter-params'

const empty: TextbookListFilters = {
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: '',
  textbookName: '',
  useStatus: 'USED',
}

describe('textbook-filter-params', () => {
  it('sends useStatus when 사용/미사용 and optional grade/textbookName', () => {
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

  it('omits ALL/empty filters including useStatus 전체', () => {
    const params = textbooksParamsFromFilters({ ...empty, useStatus: 'ALL' })
    expect(params.useStatus).toBeUndefined()
    expect(params.grade).toBeUndefined()
    expect(params.textbookName).toBeUndefined()
    expect(params.businessArea).toBeUndefined()
  })

  it('defaults missing tb_use to ALL', () => {
    expect(parseTextbookUseStatus(null)).toBe('ALL')
    expect(parseTextbookUseStatus('ALL')).toBe('ALL')
    expect(parseTextbookUseStatus('UNUSED')).toBe('UNUSED')
    expect(parseTextbookUseStatus('USED')).toBe('USED')
  })
})
