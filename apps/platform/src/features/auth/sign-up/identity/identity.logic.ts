import { calculateInternationalAge } from '../lib/sign-up.utils'
import { MIN_GENERAL_MEMBER_AGE } from '../lib/sign-up.constants'

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
