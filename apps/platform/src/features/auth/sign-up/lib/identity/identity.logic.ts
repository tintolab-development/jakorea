import { calculateInternationalAge } from '../utils'
import { MIN_GENERAL_MEMBER_AGE } from '../constants'
import { readSignupWizardFields } from '../signup-wizard-field-storage'
import {
  isUnderAgeSignUpWizardPhase,
  parseSignUpPhase,
  type SignUpWizardPhase,
} from '../wizard-location'

export type BirthStepValidationResult =
  | { status: 'valid' }
  | { status: 'invalid-format'; message: string }
  | { status: 'under-age' }

export function validateBirthStep(birthDate: string): BirthStepValidationResult {
  const age = calculateInternationalAge(birthDate)

  if (age === null) {
    return {
      status: 'invalid-format',
      message: '생년월일을 YYYY.MM.DD 형식으로 입력해 주세요.',
    }
  }

  if (age < MIN_GENERAL_MEMBER_AGE) {
    return { status: 'under-age' }
  }

  return { status: 'valid' }
}

export function isBirthStepValid(birthDate: string, gender: string | null) {
  return birthDate.trim().length > 0 && gender !== null
}

/** 미성년 가입 위저드 — URL phase 또는 저장된 생년월일(만 14세 미만) */
export function resolveIsUnderAgeSignup(
  phase: SignUpWizardPhase | null,
  birthDate: string,
): boolean {
  if (isUnderAgeSignUpWizardPhase(phase)) return true
  if (readSignupWizardFields()?.under14Flow === true) return true
  if (!birthDate.trim()) return false
  return validateBirthStep(birthDate).status === 'under-age'
}

export function resolveIsUnderAgeSignupFromSearchParams(
  searchParams: URLSearchParams,
  birthDate: string,
): boolean {
  return resolveIsUnderAgeSignup(parseSignUpPhase(searchParams), birthDate)
}
