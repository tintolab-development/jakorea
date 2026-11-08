/** CMS 비밀번호 최소 길이 */
export const REGISTER_PASSWORD_MIN_LENGTH = 8

export const REGISTER_PASSWORD_HELP_TEXT = '영문, 숫자, 특수문자를 조합해 12자 이상 입력해 주세요.'

export const REGISTER_PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않습니다.'

/** 비밀번호 형식 오류 시 재입력 칸 안내 */
export const REGISTER_PASSWORD_CONFIRM_CONDITION_MESSAGE = '비밀번호 조건을 확인해 주세요.'

export const REGISTER_PASSWORD_CONDITION_MESSAGE =
  '영문, 숫자, 특수문자를 조합해 12자 이상 입력해 주세요.'

/** 영문·숫자·특수문자 포함, 12자 이상, 공백 불가 */
const PASSWORD_REGEX = /^(?!.*\s)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{12,}$/

export function isValidRegisterPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}
