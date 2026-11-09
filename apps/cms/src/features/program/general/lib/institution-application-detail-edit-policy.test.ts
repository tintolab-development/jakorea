import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  formatInstitutionApplicationGradeDisplay,
  shouldShowInstitutionApplicationEducationFormatField,
} from './institution-application-detail-edit-policy'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides,
  } as Program
}

describe('shouldShowInstitutionApplicationEducationFormatField', () => {
  it('GET 라벨이 온라인이어도 overlay 참여자 선택이면 true', () => {
    expect(
      shouldShowInstitutionApplicationEducationFormatField(
        baseProgram({
          generalCommonInfo: { educationFormLabel: '온라인' },
          registrationOverlay: {
            'generalRegistration.typeSettings.singleEducationForm':
              EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
          },
        })
      )
    ).toBe(true)
  })

  it('라벨이 참여자 선택이면 overlay 없어도 true', () => {
    expect(
      shouldShowInstitutionApplicationEducationFormatField(
        baseProgram({
          generalCommonInfo: { educationFormLabel: '참여자 선택' },
        })
      )
    ).toBe(true)
  })

  it('라벨·overlay 모두 온라인이면 false', () => {
    expect(
      shouldShowInstitutionApplicationEducationFormatField(
        baseProgram({
          generalCommonInfo: { educationFormLabel: '온라인' },
          registrationOverlay: {
            'generalRegistration.typeSettings.singleEducationForm': 'online',
          },
        })
      )
    ).toBe(false)
  })
})

describe('formatInstitutionApplicationGradeDisplay', () => {
  it('학년만 남긴다', () => {
    expect(formatInstitutionApplicationGradeDisplay('1학년')).toBe('1학년')
    expect(formatInstitutionApplicationGradeDisplay('2')).toBe('2학년')
    expect(formatInstitutionApplicationGradeDisplay('초등학교 3학년')).toBe('3학년')
    expect(formatInstitutionApplicationGradeDisplay('JA초등학교 4학년')).toBe('4학년')
    expect(formatInstitutionApplicationGradeDisplay('-')).toBe('')
  })
})
