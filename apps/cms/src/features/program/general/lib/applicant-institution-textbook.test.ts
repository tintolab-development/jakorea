import { describe, expect, it } from 'vitest'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL,
  buildApplicantInstitutionTextbookOptions,
  resolveApplicantInstitutionTextbookDisplayLabel,
  shouldShowGeneralOrganizationApplicantTextbookField,
} from './applicant-institution-textbook'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from './individual-applicant-textbook'
import type { Program } from '@/types/domain'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'

const program = {
  businessArea: '경제교육',
  targetLevel: 'elementary',
} as Program

const catalog: TextbookRow[] = [
  {
    id: '101',
    businessArea: '경제교육',
    educationTarget: '초등학교',
    grade: '3학년',
    textbookName: '성공하는 경제생활',
    textbookNameEn: '',
    educationStages: [],
    useStatus: 'USED',
    registrant: '-',
    registeredAt: '',
  },
  {
    id: '102',
    businessArea: '경제교육',
    educationTarget: '중학교',
    grade: '3학년',
    textbookName: '중등 교재',
    textbookNameEn: '',
    educationStages: [],
    useStatus: 'USED',
    registrant: '-',
    registeredAt: '',
  },
]

const institution = {
  id: '1',
  educationGrade: '3학년',
  detail: {
    textbookId: '101',
    textbookName: '성공하는 경제생활',
  },
} as ApplicantSchoolRow

describe('buildApplicantInstitutionTextbookOptions', () => {
  it('해당 없음 + 교재명 educationTarget 옵션을 만든다', () => {
    const options = buildApplicantInstitutionTextbookOptions(program, '3학년', catalog)
    expect(options[0]).toEqual({
      value: TEXTBOOK_NOT_USED_OPTION_VALUE,
      label: '해당 없음',
      textbookName: '해당 없음',
    })
    expect(options.map(o => o.label)).toContain('성공하는 경제생활 초등학교')
    expect(options.map(o => o.label)).toContain('중등 교재 중학교')
  })

  it('program materials 후보와 무관하게 matches 교재를 노출한다', () => {
    const options = buildApplicantInstitutionTextbookOptions(program, '3학년', catalog)
    expect(options.map(o => o.value)).toContain('101')
  })
})

describe('resolveApplicantInstitutionTextbookDisplayLabel', () => {
  it('선택된 교재를 교재명 educationTarget 형식으로 표시한다', () => {
    expect(
      resolveApplicantInstitutionTextbookDisplayLabel({
        program,
        institution,
        catalog,
      })
    ).toBe('성공하는 경제생활 초등학교')
  })

  it('교재 미지정 시 해당 없음을 반환한다', () => {
    expect(
      resolveApplicantInstitutionTextbookDisplayLabel({
        program,
        institution: { ...institution, detail: {} },
        catalog,
      })
    ).toBe(APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL)
  })
})

describe('shouldShowGeneralOrganizationApplicantTextbookField', () => {
  const generalOrganization = { id: '9001', backendProgramType: 'GENERAL_ORGANIZATION' }

  it('일반(기관형) 승인 완료면 교재명 행을 노출한다', () => {
    expect(shouldShowGeneralOrganizationApplicantTextbookField(generalOrganization, 'approved')).toBe(
      true
    )
  })

  it('승인 대기·반려는 노출하지 않는다', () => {
    expect(shouldShowGeneralOrganizationApplicantTextbookField(generalOrganization, 'pending')).toBe(
      false
    )
    expect(shouldShowGeneralOrganizationApplicantTextbookField(generalOrganization, 'rejected')).toBe(
      false
    )
  })

  it('1사1교·개인형은 이 행을 쓰지 않는다 (1사1교는 기존 승인 현황 옆 배치)', () => {
    expect(
      shouldShowGeneralOrganizationApplicantTextbookField(
        { id: '170001', backendProgramType: 'COMPANY_SCHOOL' },
        'approved'
      )
    ).toBe(false)
    expect(
      shouldShowGeneralOrganizationApplicantTextbookField(
        { id: '9002', backendProgramType: 'GENERAL_INDIVIDUAL' },
        'approved'
      )
    ).toBe(false)
    expect(shouldShowGeneralOrganizationApplicantTextbookField(null, 'approved')).toBe(false)
  })
})
