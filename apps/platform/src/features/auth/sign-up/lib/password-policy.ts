/** 회원(일반·교사·미성년·관리자 등록 회원) 가입·재설정·마이페이지·최초 비밀번호 변경 — USER-FUNC-0005 */
export const MEMBER_PASSWORD_HELP_TEXT =
  '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'

/**
 * 서버와 같은 특수문자 판정: 공백이 아니면서 ASCII 영문·숫자가 아닌 문자.
 * 공백은 비밀번호에 쓸 수 있지만 특수문자로 치지 않는다.
 */
const PASSWORD_RULE_LETTER = /[A-Za-z]/
const PASSWORD_RULE_DIGIT = /\d/
const PASSWORD_RULE_SPECIAL = /[^A-Za-z\d\s]/

function meetsPasswordComposition(value: string, minLength: number) {
  return (
    value.length >= minLength &&
    PASSWORD_RULE_LETTER.test(value) &&
    PASSWORD_RULE_DIGIT.test(value) &&
    PASSWORD_RULE_SPECIAL.test(value)
  )
}

/** 회원 비밀번호 — 8자 이상. 관리자 등록 회원 포함(12자는 CMS 관리자 계정만). */
export function isValidMemberPassword(value: string) {
  return meetsPasswordComposition(value, 8)
}
