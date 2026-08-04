/** 포털 회원 로그인 OpenAPI 최소 타입 (앱 경계 — CMS generated import 금지) */

export type MemberLoginRequest = {
  email: string
  password: string
}

export type AuthTokenResponse = {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresInSeconds?: number
  /** 관리자 발급 임시 비밀번호 변경 필요 */
  passwordChangeRequired?: boolean
}
