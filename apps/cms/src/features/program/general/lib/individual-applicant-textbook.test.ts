import { describe, expect, it } from 'vitest'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import {
  TEXTBOOK_NOT_USED_OPTION_VALUE,
  buildIndividualApplicantTextbookOptions,
  resolveIndividualApplicantTextbookDisplay,
  shouldShowGeneralIndividualApplicantTextbookField,
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

  it('program materials 후보와 무관하게 사업분야·신청학년 matches를 노출한다', () => {
    const options = buildIndividualApplicantTextbookOptions(program, '3학년', catalog)
    expect(options.map(o => o.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '101'])
  })
})

describe('resolveIndividualApplicantTextbookDisplay', () => {
  it('선택된 교재를 교재명 educationTarget으로 표시한다', () => {
    const row = {
      textbookId: '101',
      textbookName: '성공하는 경제생활',
      textbookKits: 2,
      textbookQuantity: 48,
      educationGrade: '3학년',
      detail: { teamMemberCount: 1 },
      textbookStatus: 'preparing',
    } as GeneralIndividualApplicantRow

    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog)).toMatchObject({
      name: '성공하는 경제생활 초등학교',
      kitsLabel: '2키트 (48권)',
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

  it('서버가 반환한 교재 수량을 그대로 표시한다', () => {
    const row = {
      textbookId: '101',
      textbookName: '성공하는 경제생활',
      educationGrade: '3학년',
      detail: { teamMemberCount: 50 },
      textbookKits: 2,
      textbookQuantity: 48,
      textbookStatus: 'preparing',
    } as GeneralIndividualApplicantRow

    expect(resolveIndividualApplicantTextbookDisplay(program, row, catalog).kitsLabel).toBe(
      '2키트 (48권)'
    )
  })
})

describe('shouldShowGeneralIndividualApplicantTextbookField (개인 시안 06-1·06-2)', () => {
  const individual = { generalProgramAudience: 'individual' } as Program
  const organization = { generalProgramAudience: 'organization' } as unknown as Program

  it('개인형 승인 완료면 교재명 행을 노출한다', () => {
    expect(shouldShowGeneralIndividualApplicantTextbookField(individual, 'approved')).toBe(true)
  })

  it('승인 대기·반려·프로그램 없음·기관형은 노출하지 않는다', () => {
    expect(shouldShowGeneralIndividualApplicantTextbookField(individual, 'pending')).toBe(false)
    expect(shouldShowGeneralIndividualApplicantTextbookField(individual, 'rejected')).toBe(false)
    expect(shouldShowGeneralIndividualApplicantTextbookField(null, 'approved')).toBe(false)
    expect(shouldShowGeneralIndividualApplicantTextbookField(organization, 'approved')).toBe(false)
  })
})
