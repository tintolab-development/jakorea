import { describe, expect, it } from 'vitest'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from './individual-applicant-textbook'
import {
  buildCombinedClassTextbookSelectOptions,
  buildParticipatingInstitutionTextbookSelectOptions,
} from './participating-institution-textbook'

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

describe('buildCombinedClassTextbookSelectOptions', () => {
  it('해당 없음 + 교재명 educationTarget 라벨을 만든다', () => {
    const options = buildCombinedClassTextbookSelectOptions(program, catalog)
    expect(options[0].value).toBe(TEXTBOOK_NOT_USED_OPTION_VALUE)
    expect(options[1]).toMatchObject({
      value: '101',
      label: '성공하는 경제생활 초등학교',
    })
  })

  it('program materials로 교재를 교집합한다', () => {
    const options = buildCombinedClassTextbookSelectOptions(program, catalog, new Set(['999']))
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe(TEXTBOOK_NOT_USED_OPTION_VALUE)
  })
})

describe('buildParticipatingInstitutionTextbookSelectOptions', () => {
  it('학년 matches가 비면 프로그램 사업분야 교재로 폴백한다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '1학년',
      gradeCatalog: [],
      programCatalog: catalog,
    })
    expect(options.map(option => option.value)).toEqual([
      TEXTBOOK_NOT_USED_OPTION_VALUE,
      '101',
    ])
  })

  it('학년 matches가 있으면 해당 학년 교재만 쓴다', () => {
    const gradeCatalog: TextbookRow[] = [
      {
        ...catalog[0],
        id: '201',
        grade: '1학년',
        textbookName: '경제생활 첫걸음',
      },
    ]
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '1학년',
      gradeCatalog,
      programCatalog: catalog,
    })
    expect(options.map(option => option.value)).toEqual([
      TEXTBOOK_NOT_USED_OPTION_VALUE,
      '201',
    ])
  })

  it('materials가 비어 있으면 교집합하지 않는다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '1학년',
      gradeCatalog: [],
      programCatalog: catalog,
      programMaterialTextbookIds: new Set(),
    })
    expect(options).toHaveLength(2)
    expect(options[1].value).toBe('101')
  })
})
