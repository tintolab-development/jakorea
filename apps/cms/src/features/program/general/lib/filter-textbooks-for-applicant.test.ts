import { describe, expect, it } from 'vitest'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import {
  buildTextbookMatchesParamsFromProgram,
  serializeIndividualTextbookCatalogKey,
} from '@/features/textbook/api/textbook-program-catalog'
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

  it('중학교 전학년 교재는 신청 학년 3학년에 포함한다', () => {
    const program = {
      businessArea: '경제금융',
      targetLevel: 'middle',
    } as Program
    const rows = filterTextbooksForApplicant(program, '3학년', [
      makeTextbook({
        id: '186981',
        educationTarget: '중학교',
        grade: '전학년',
        textbookName: '경제금융(중학교재)',
      }),
    ])
    expect(rows.map(row => row.id)).toEqual(['186981'])
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

  it('성인과 중학생이면 중학교 교재를 포함하고 다른 학교급은 뺀다', () => {
    const program = {
      businessArea: '기업가정신',
      targetLevels: ['adult', 'middle'],
    } as Program
    const rows = filterTextbooksForApplicant(program, '1학년', [
      makeTextbook({
        id: 'middle',
        businessArea: '기업가정신',
        educationTarget: '중학교',
        grade: '전학년',
        textbookName: '중학 교재',
      }),
      makeTextbook({
        id: 'elementary',
        businessArea: '기업가정신',
        educationTarget: '초등학교',
        grade: '전학년',
        textbookName: '초등 교재',
      }),
    ])
    expect(rows.map(row => row.id)).toEqual(['middle'])
  })

  it('교재 교육대상이 중학생 라벨이어도 중학교로 매칭한다', () => {
    const program = {
      businessArea: '기업가정신',
      targetLevels: ['성인', '중학생'],
    } as unknown as Program
    const rows = filterTextbooksForApplicant(program, '2학년', [
      makeTextbook({
        id: 'middle',
        businessArea: '기업가정신',
        educationTarget: '중학생' as TextbookRow['educationTarget'],
        grade: '전학년',
        textbookName: '중학 교재',
      }),
    ])
    expect(rows.map(row => row.id)).toEqual(['middle'])
  })
})

describe('filterTextbooksForIndividualApplicant', () => {
  it('사업분야 alias와 마스터명이 달라도 같은 분야로 본다', () => {
    const program = {
      businessArea: 'economy_finance',
      targetLevel: 'elementary',
    } as Program
    const rows = filterTextbooksForIndividualApplicant(program, '3학년', [
      makeTextbook({ id: '1', businessArea: '경제금융', grade: '3학년' }),
    ])
    expect(rows.map(row => row.id)).toEqual(['1'])
  })

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

  it('성인은 건너뛰고 중학생은 중학교로 둔다', () => {
    expect(
      resolveProgramEducationTargets({
        targetLevels: ['adult', '중학생'],
      } as Program)
    ).toEqual(['중학교'])
  })
})

describe('serializeIndividualTextbookCatalogKey', () => {
  it('사업분야와 신청 학년이 바뀌면 matches 쿼리 키도 바뀐다', () => {
    const program = { businessArea: '경제금융' } as Program
    expect(serializeIndividualTextbookCatalogKey(program, '3학년')).toBe('경제금융|3학년')
    expect(serializeIndividualTextbookCatalogKey(program, '5학년')).toBe('경제금융|5학년')
    expect(serializeIndividualTextbookCatalogKey(program, '3')).toBe('경제금융|3학년')
    expect(
      serializeIndividualTextbookCatalogKey({ businessArea: 'economy_finance' } as Program, '3학년')
    ).toBe('경제금융|3학년')
    expect(serializeIndividualTextbookCatalogKey(program, '')).toBe('')
  })
})

describe('buildTextbookMatchesParamsFromProgram', () => {
  it('성인·중학생은 중학교 교재만 조회한다', () => {
    expect(
      buildTextbookMatchesParamsFromProgram({
        businessArea: '기업가정신',
        targetLevels: ['adult', 'middle'],
      } as Program).educationTarget
    ).toBe('중학교')
  })

  it('교재 대상이 둘 이상이면 educationTarget을 비워 합집합을 받는다', () => {
    expect(
      buildTextbookMatchesParamsFromProgram({
        businessArea: '기업가정신',
        targetLevels: ['elementary', 'middle'],
      } as Program).educationTarget
    ).toBeUndefined()
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
