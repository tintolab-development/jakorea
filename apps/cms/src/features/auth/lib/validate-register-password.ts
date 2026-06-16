export const REGISTER_PASSWORD_HELP_TEXT =
  '영문, 숫자, 특수문자를 조합하여 8자 이상 입력해 주세요.'

export const REGISTER_PASSWORD_MISMATCH_MESSAGE =
  '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.'

export const REGISTER_PASSWORD_CONDITION_MESSAGE = '비밀번호 조건을 확인해 주세요.'

const PASSWORD_MIN_LENGTH = 8
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/
const HAS_SPECIAL = /[^a-zA-Z0-9]/

export function isValidRegisterPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false
  }
  if (!HAS_LETTER.test(password)) {
    return false
  }
  if (!HAS_DIGIT.test(password)) {
    return false
  }
  if (!HAS_SPECIAL.test(password)) {
    return false
  }
  return true
}
