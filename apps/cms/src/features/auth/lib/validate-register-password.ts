/** 관리자 셀프 가입 API(`signup/complete`) 비밀번호 최소 길이 */
export const REGISTER_PASSWORD_MIN_LENGTH = 12

export const REGISTER_PASSWORD_HELP_TEXT =
  '12자 이상, 공백 없이 영문 대·소문자, 숫자, 특수문자 중 3가지 이상 조합해 주세요.'

export const REGISTER_PASSWORD_MISMATCH_MESSAGE =
  '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.'

export const REGISTER_PASSWORD_CONDITION_MESSAGE = '비밀번호 조건을 확인해 주세요.'

const PASSWORD_REGEX =
  /^(?!.*\s)(?=.{12,}$)(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9\s])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])).*$/

export function isValidRegisterPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}
