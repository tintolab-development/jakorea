import { describe, expect, it } from 'vitest'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from './individual-applicant-textbook'
import {
  buildCombinedClassTextbookSelectOptions,
  buildParticipatingInstitutionTextbookSelectOptions,
  ensureTextbookNotUsedSelectOption,
  formatParticipatingInstitutionKitQuantity,
  programOffersParticipatingTextbookSelect,
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
  it('사업 분야가 같고 신청 학년이 포함된 교재만 노출한다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program: { businessArea: '기업가정신', targetLevel: 'elementary' } as Program,
      educationGrade: '3학년',
      catalog: [
        {
          ...catalog[0],
          id: 'elem',
          businessArea: '기업가정신',
          educationTarget: '초등학교',
          grade: '1학년, 2학년, 3학년, 4학년',
          textbookName: '초등 교재',
        },
        {
          ...catalog[0],
          id: 'middle',
          businessArea: '기업가정신',
          educationTarget: '중학교',
          grade: '전학년',
          textbookName: '중학 교재',
        },
        {
          ...catalog[0],
          id: 'other-grade',
          businessArea: '기업가정신',
          educationTarget: '초등학교',
          grade: '5학년, 6학년',
          textbookName: '고학년 교재',
        },
        {
          ...catalog[0],
          id: 'other',
          businessArea: '경제금융',
          educationTarget: '초등학교',
          grade: '3학년',
          textbookName: '다른 분야',
        },
      ],
    })
    expect(options.map(option => option.value)).toEqual([
      TEXTBOOK_NOT_USED_OPTION_VALUE,
      'middle',
      'elem',
    ])
    expect(options.map(option => option.label)).toContain('초등 교재 초등학교')
    expect(options.map(option => option.label)).toContain('중학 교재 중학교')
    expect(options.map(option => option.value)).not.toContain('other-grade')
    expect(options.map(option => option.value)).not.toContain('other')
  })

  it('같은 사업분야 교재가 없어도 해당 없음을 둔다', () => {
    const options = buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: '3학년',
      catalog: [],
    })
    expect(options).toEqual([
      {
        value: TEXTBOOK_NOT_USED_OPTION_VALUE,
        label: '해당 없음',
        textbookName: '해당 없음',
      },
    ])
  })
})

describe('ensureTextbookNotUsedSelectOption', () => {
  it('옵션이 비어 있어도 해당 없음을 앞에 둔다', () => {
    expect(ensureTextbookNotUsedSelectOption([])).toEqual([
      {
        value: TEXTBOOK_NOT_USED_OPTION_VALUE,
        label: '해당 없음',
        textbookName: '해당 없음',
      },
    ])
  })
})

describe('formatParticipatingInstitutionKitQuantity', () => {
  it('기관 GET 키트·권수만 표시하고 0·null은 미산출로 둔다', () => {
    expect(formatParticipatingInstitutionKitQuantity(1, 24)).toBe('1키트 (24권)')
    expect(formatParticipatingInstitutionKitQuantity(3, 72)).toBe('3키트 (72권)')
    expect(formatParticipatingInstitutionKitQuantity(3, null)).toBe('3키트')
    expect(formatParticipatingInstitutionKitQuantity(null, 24)).toBe('24권')
    expect(formatParticipatingInstitutionKitQuantity(0, 0)).toBe('-')
    expect(formatParticipatingInstitutionKitQuantity(null, null)).toBe('-')
  })

  it('학생 수·프로그램 materials로 클라이언트 재계산하지 않는다', () => {
    expect(formatParticipatingInstitutionKitQuantity(null, null)).toBe('-')
  })
})

describe('programOffersParticipatingTextbookSelect', () => {
  it('커리큘럼형·일정형 모두 매칭 교재가 없어도 셀렉트를 연다', () => {
    expect(
      programOffersParticipatingTextbookSelect({
        generalProgramEducationStructure: 'curriculum',
      } as Program)
    ).toBe(true)
    expect(
      programOffersParticipatingTextbookSelect({
        generalProgramEducationStructure: 'schedule',
      } as Program)
    ).toBe(true)
  })
})
