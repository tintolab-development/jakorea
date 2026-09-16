import { describe, expect, it } from 'vitest'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import {
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from './filter-textbooks-for-applicant'
import type { Program } from '@/types/domain'

const baseProgram = {
  businessArea: '경제교육',
  targetLevel: 'elementary',
} as Program

function makeTextbook(partial: Partial<TextbookRow>): TextbookRow {
  return {
    id: '1',
    businessArea: '경제교육',
    educationTarget: '초등학교',
    grade: '3학년',
    textbookName: '성공하는 경제생활',
    textbookNameEn: '',
    educationStages: [],
    useStatus: 'USED',
    registrant: '-',
    registeredAt: '',
    ...partial,
  }
}

describe('filterTextbooksForApplicant', () => {
  it('신청 학년이 교재 학년 범위에 포함되면 목록에 포함한다', () => {
    const rows = filterTextbooksForApplicant(
      baseProgram,
      '3학년',
      [
        makeTextbook({ id: '1', grade: '3-4' }),
        makeTextbook({ id: '2', grade: '5-6', textbookName: '다른 교재' }),
      ]
    )
    expect(rows.map(row => row.id)).toEqual(['1'])
  })

  it('API match 응답처럼 학년이 숫자만 있어도 매칭한다', () => {
    const rows = filterTextbooksForApplicant(
      baseProgram,
      '3학년',
      [makeTextbook({ id: '1', grade: '3' })]
    )
    expect(rows).toHaveLength(1)
  })
})

describe('resolveTextbookOptionLabel', () => {
  it('교재명 (교육대상) 형식으로 표시한다', () => {
    expect(
      resolveTextbookOptionLabel(
        makeTextbook({ textbookName: '성공하는 경제생활', educationTarget: '초등학교' })
      )
    ).toBe('성공하는 경제생활 (초등)')
  })
})
