import { describe, expect, it } from 'vitest'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import {
  TEXTBOOK_NOT_USED_OPTION_VALUE,
  buildIndividualApplicantTextbookOptions,
  resolveIndividualApplicantTextbookDisplay,
} from './individual-applicant-textbook'

const program = {
  businessArea: '경제금융',
  targetLevel: 'elementary',
} as Program

const catalog: TextbookRow[] = [
  {
    id: '101',
    businessArea: '경제금융',
    educationTarget: '초등학교',
    grade: '3학년',
    textbookName: '성공하는 경제생활',
    textbookNameEn: '',
    educationStages: [],
    useStatus: 'USED',
    registrant: '-',
    registeredAt: '',
  },
]

describe('buildIndividualApplicantTextbookOptions', () => {
  it('해당 없음 + 사업분야·신청학년 교재를 교재명 educationTarget으로 노출한다', () => {
    const options = buildIndividualApplicantTextbookOptions(program, '3학년', catalog)
    expect(options[0]).toEqual({
      value: TEXTBOOK_NOT_USED_OPTION_VALUE,
      label: '해당 없음',
      textbookName: '해당 없음',
    })
    expect(options[1]).toEqual({
      value: '101',
      label: '성공하는 경제생활 초등학교',
      textbookName: '성공하는 경제생활',
    })
  })

  it('program materials에 없는 교재는 제외한다', () => {
    const options = buildIndividualApplicantTextbookOptions(
      program,
      '3학년',
      catalog,
      new Set(['999'])
    )
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe(TEXTBOOK_NOT_USED_OPTION_VALUE)
  })

  it('program materials에 포함된 교재만 노출한다', () => {
    const options = buildIndividualApplicantTextbookOptions(
      program,
      '3학년',
      catalog,
      new Set(['101'])
    )
    expect(options.map(o => o.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '101'])
  })
})

describe('resolveIndividualApplicantTextbookDisplay', () => {
  it('선택된 교재를 교재명 educationTarget으로 표시한다', () => {
    const row = {
      textbookId: '101',
      textbookName: '성공하는 경제생활',
      educationGrade: '3학년',
      detail: { teamMemberCount: 1 },
      textbookStatus: 'preparing',
    } as GeneralIndividualApplicantRow

    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog)).toMatchObject({
      name: '성공하는 경제생활 초등학교',
      kitsLabel: '1키트 (24권)',
      isUnspecified: false,
    })
  })

  it('미지정(textbook null)은 해당 없음이다', () => {
    const row = {} as GeneralIndividualApplicantRow
    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog)).toMatchObject({
      name: '해당 없음',
      status: 'not_applicable',
      isUnspecified: true,
    })
  })

  it('해당 없음 선택 시 해당 없음으로 표시한다', () => {
    const row = {
      textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
      textbookName: '해당 없음',
    } as GeneralIndividualApplicantRow

    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog)).toMatchObject({
      name: '해당 없음',
      status: 'not_applicable',
      isUnspecified: true,
    })
  })

  it('등록 인원 기준 준비 수량을 자동 산출한다', () => {
    const row = {
      textbookId: '101',
      textbookName: '성공하는 경제생활',
      educationGrade: '3학년',
      detail: { teamMemberCount: 50 },
      textbookStatus: 'preparing',
    } as GeneralIndividualApplicantRow

    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog).kitsLabel).toBe(
      '3키트 (72권)'
    )
  })
})
