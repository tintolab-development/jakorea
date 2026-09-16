import { describe, expect, it } from 'vitest'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL,
  resolveApplicantInstitutionTextbookDisplayLabel,
} from './applicant-institution-textbook'
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
]

const institution = {
  id: '1',
  educationGrade: '3학년',
  detail: {
    textbookId: '101',
    textbookName: '성공하는 경제생활',
  },
} as ApplicantSchoolRow

describe('resolveApplicantInstitutionTextbookDisplayLabel', () => {
  it('선택된 교재를 교재명 (교육대상) 형식으로 표시한다', () => {
    expect(
      resolveApplicantInstitutionTextbookDisplayLabel({
        program,
        institution,
        catalog,
      })
    ).toBe('성공하는 경제생활 (초등)')
  })

  it('교재 미지정 시 미정을 반환한다', () => {
    expect(
      resolveApplicantInstitutionTextbookDisplayLabel({
        program,
        institution: { ...institution, detail: {} },
        catalog,
      })
    ).toBe(APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL)
  })
})
