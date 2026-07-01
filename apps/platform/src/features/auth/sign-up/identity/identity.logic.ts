import { calculateInternationalAge } from '../lib/sign-up.utils'
import { MIN_GENERAL_MEMBER_AGE } from '../lib/sign-up.constants'

export function validateBirthStep(birthDate: string): string | null {
  const age = calculateInternationalAge(birthDate)

  if (age === null) {
    return '생년월일을 YYYY.MM.DD 형식으로 입력해 주세요.'
  }

  if (age < MIN_GENERAL_MEMBER_AGE) {
    return '만 14세 미만 회원가입은 별도 프로세스로 진행됩니다.'
  }

  return null
}

export function isBirthStepValid(birthDate: string, gender: string | null) {
  return birthDate.trim().length > 0 && gender !== null
}
