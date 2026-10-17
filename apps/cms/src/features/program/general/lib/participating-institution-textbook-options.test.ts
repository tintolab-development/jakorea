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

  it('program materials 후보와 무관하게 합반용 카탈로그를 노출한다', () => {
    const options = buildCombinedClassTextbookSelectOptions(program, catalog)
    expect(options.map(option => option.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '101'])
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
    expect(options.map(option => option.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '101'])
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
    expect(options.map(option => option.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '201'])
  })

  it('배정 교재가 학년 matches와 안 맞으면 전학년 교재를 유지한다', () => {
    const middleProgram = {
      businessArea: '경제금융',
      targetLevel: 'middle',
    } as Program
    const allGrades: TextbookRow = {
      id: '186981',
      businessArea: '경제금융',
      educationTarget: '중학교',
      grade: '전학년',
      textbookName: '경제금융(중학교재)',
      textbookNameEn: '',
      educationStages: [],
      useStatus: 'USED',
      registrant: '-',
      registeredAt: '',
    }
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program: middleProgram,
      educationGrade: '3학년',
      gradeCatalog: [allGrades],
      programCatalog: [allGrades],
    })
    expect(options.map(option => option.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '186981'])
    expect(options[1]?.label).toBe('경제금융(중학교재) 중학교')
  })

  it('program materials 후보와 무관하게 사업분야·학년 matches를 노출한다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '1학년',
      gradeCatalog: [],
      programCatalog: catalog,
    })
    expect(options.map(option => option.value)).toEqual([TEXTBOOK_NOT_USED_OPTION_VALUE, '101'])
  })

  it('program materials가 비어 있어도 matches를 노출한다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '1학년',
      gradeCatalog: [],
      programCatalog: catalog,
    })
    expect(options).toHaveLength(2)
    expect(options[1].value).toBe('101')
  })
})
