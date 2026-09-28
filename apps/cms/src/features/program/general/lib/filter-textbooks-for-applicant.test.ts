import { describe, expect, it } from 'vitest'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import {
  filterTextbooksForApplicant,
  filterTextbooksForIndividualApplicant,
  resolveIndividualTextbookOptionLabel,
  resolveProgramEducationTargets,
  resolveTextbookOptionLabel,
} from './filter-textbooks-for-applicant'
import type { Program } from '@/types/domain'

const baseProgram = {
  businessArea: '경제금융',
  targetLevel: 'elementary',
} as Program

function makeTextbook(partial: Partial<TextbookRow>): TextbookRow {
  return {
    id: '1',
    businessArea: '경제금융',
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
    const rows = filterTextbooksForApplicant(baseProgram, '3학년', [
      makeTextbook({ id: '1', grade: '3-4' }),
      makeTextbook({ id: '2', grade: '5-6', textbookName: '다른 교재' }),
    ])
    expect(rows.map(row => row.id)).toEqual(['1'])
  })

  it('API match 응답처럼 학년이 숫자만 있어도 매칭한다', () => {
    const rows = filterTextbooksForApplicant(baseProgram, '3학년', [
      makeTextbook({ id: '1', grade: '3' }),
    ])
    expect(rows).toHaveLength(1)
  })

  it('사업 분야가 다르면 제외한다', () => {
    const rows = filterTextbooksForApplicant(baseProgram, '3학년', [
      makeTextbook({ id: '1', businessArea: '진로취업' }),
    ])
    expect(rows).toHaveLength(0)
  })

  it('복수 targetLevels면 해당 교육대상 교재를 모두 포함한다', () => {
    const program = {
      businessArea: '경제금융',
      targetLevels: ['elementary', 'middle'],
    } as Program
    const rows = filterTextbooksForApplicant(program, '1학년', [
      makeTextbook({
        id: '1',
        educationTarget: '초등학교',
        grade: '1학년',
        textbookName: '초등 교재',
      }),
      makeTextbook({
        id: '2',
        educationTarget: '중학교',
        grade: '1학년',
        textbookName: '중등 교재',
      }),
      makeTextbook({
        id: '3',
        educationTarget: '고등학교',
        grade: '1학년',
        textbookName: '고등 교재',
      }),
    ])
    expect(rows.map(row => row.id).sort()).toEqual(['1', '2'])
  })
})

describe('filterTextbooksForIndividualApplicant', () => {
  it('프로그램 교육대상과 달라도 사업분야·학년만 맞으면 포함한다', () => {
    const program = {
      businessArea: '경제금융',
      targetLevel: 'elementary',
    } as Program
    const rows = filterTextbooksForIndividualApplicant(program, '1학년', [
      makeTextbook({
        id: '2',
        educationTarget: '중학교',
        grade: '1학년',
        textbookName: '중등 교재',
      }),
    ])
    expect(rows.map(row => row.id)).toEqual(['2'])
  })
})

describe('resolveProgramEducationTargets', () => {
  it('targetLevels 배열을 교재 교육대상으로 변환한다', () => {
    expect(
      resolveProgramEducationTargets({
        targetLevels: ['elementary', 'high'],
      } as Program)
    ).toEqual(['초등학교', '고등학교'])
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

describe('resolveIndividualTextbookOptionLabel', () => {
  it('교재명 + educationTarget 형식으로 표시한다', () => {
    expect(
      resolveIndividualTextbookOptionLabel(
        makeTextbook({
          textbookName: 'JA 경제생활 첫걸음',
          educationTarget: '초등학교',
        })
      )
    ).toBe('JA 경제생활 첫걸음 초등학교')
  })
})
