/** 일반·교사 회원 가입·재설정·마이페이지 변경 — USER-FUNC-0005 */
export const MEMBER_PASSWORD_HELP_TEXT =
  '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'

/** 관리자가 등록한 계정 최초 비밀번호 변경 */
export const ADMIN_REGISTERED_PASSWORD_HELP_TEXT =
  '영문, 숫자, 특수문자를 조합해 12자 이상 입력해 주세요.'

export function isValidMemberPassword(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)
}

/** 관리자 등록 계정 비밀번호(12자). 회원 가입은 `isValidMemberPassword`. */
export function isValidPassword(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/.test(value)
}
