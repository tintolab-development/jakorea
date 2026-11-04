export const REGISTER_PASSWORD_CONDITION_MESSAGE =
  '영문, 숫자, 특수문자를 조합해 12자 이상 입력해 주세요.'

const PASSWORD_REGEX = /^(?!.*\s)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{12,}$/

export function isValidRegisterPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}
