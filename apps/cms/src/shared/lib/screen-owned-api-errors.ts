/**
 * 화면이 직접 안내하는 API 오류 — axios 전역 오류 알럿을 띄우지 않는다(중복 안내 방지).
 * 판정은 요청 URL + `error.code`/`error.field`로만 한다.
 */

/** 내 정보 확인 재인증 — 이름·생년월일·성별이 가입 정보와 다를 때 서버 거절 코드 */
export const IDENTITY_CONTACT_MISMATCH_CODES: ReadonlySet<string> = new Set([
  'IDENTITY_VERIFICATION_NAME_MISMATCH',
  'IDENTITY_VERIFICATION_BIRTH_DATE_MISMATCH',
  'IDENTITY_VERIFICATION_GENDER_MISMATCH',
])

/** 관리자 등록(R7) — 이름·생년월일·휴대폰이 같은 회원이 이미 있을 때 */
export const ADMIN_IDENTITY_ALREADY_REGISTERED_CODE = 'ADMIN_IDENTITY_ALREADY_REGISTERED'

/** 회원 사전등록(개인·강사) — 같은 조건의 중복 코드. 관리자 등록과 같은 코드로 확정(BE 회신 2026-11-14) */
export const PRE_REGISTER_IDENTITY_DUPLICATE_CODE = ADMIN_IDENTITY_ALREADY_REGISTERED_CODE

const IDENTITY_CONTACT_PATH = /\/api\/admin\/me\/identity-contact(?:$|[?#])/
const ADMIN_ACCOUNT_BASIC_INFO_PATH = /\/api\/admin\/admin-accounts\/\d+\/basic-info(?:$|[?#])/
const ADMIN_ACCOUNT_CREATE_PATH = /\/api\/admin\/admin-accounts(?:$|[?#])/
const MEMBER_PRE_REGISTER_PATH =
  /\/api\/admin\/users\/pre-register\/(?:individual|instructor)(?:$|[?#])/

export function isScreenOwnedApiError(input: {
  url: string | undefined
  code: string | undefined
  field: string | undefined
}): boolean {
  const url = input.url ?? ''
  if (!url) return false
  // 「본인인증 실패」 팝업을 화면이 띄운다.
  if (
    input.code &&
    IDENTITY_CONTACT_MISMATCH_CODES.has(input.code) &&
    IDENTITY_CONTACT_PATH.test(url)
  ) {
    return true
  }
  // 관리자 상세 이메일 오류(중복·형식·변경 불가)는 이메일 입력란에 표시한다.
  if (input.field === 'email' && ADMIN_ACCOUNT_BASIC_INFO_PATH.test(url)) {
    return true
  }
  // 본인 정보 중복 — 화면이 「회원 정보 중복 안내」를 띄운다(관리자 등록·사전등록).
  if (
    input.code === ADMIN_IDENTITY_ALREADY_REGISTERED_CODE &&
    ADMIN_ACCOUNT_CREATE_PATH.test(url)
  ) {
    return true
  }
  if (input.code === PRE_REGISTER_IDENTITY_DUPLICATE_CODE && MEMBER_PRE_REGISTER_PATH.test(url)) {
    return true
  }
  return false
}
