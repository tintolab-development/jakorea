/**
 * 백엔드 API 경로 단일 소스 (실서버 연동 시 여기·환경 변수부터 맞춘 뒤 서비스 레이어에서 사용).
 *
 * - 오리진은 `VITE_API_BASE_URL`, 경로는 보통 아래 상수 + 서비스별 `VITE_*` 오버라이드 병행.
 * - 기존 feature 파일 내 `*_API_BASE_PATH`는 점진적으로 이쪽으로 옮기면 됨.
 */

const trimEnv = (value: string | undefined, fallback: string): string =>
  (value?.trim().replace(/\/$/, '') || fallback).replace(/\/$/, '') || fallback

/** 관리자 인증·인가 (`/api/admin/auth/...`) — Vite 프록시도 `/api`로만 전달됨 */
export const adminAuthPaths = {
  /** env `VITE_ADMIN_AUTH_API_PREFIX` 로 prefix 덮어쓰기 가능 (기본 `/api/admin/auth`) */
  prefix: trimEnv(import.meta.env.VITE_ADMIN_AUTH_API_PREFIX as string | undefined, '/api/admin/auth'),
  login: () => `${adminAuthPaths.prefix}/login`,
  logout: () => `${adminAuthPaths.prefix}/logout`,
  activity: () => `${adminAuthPaths.prefix}/activity`,
  session: () => `${adminAuthPaths.prefix}/session`,
  refresh: () => `${adminAuthPaths.prefix}/refresh`,
  /** POST — HttpOnly refresh 쿠키 폐기·삭제 (QA-0137). 쿠키 Path가 refresh라 그 하위 경로, 본문 없음 */
  refreshLogout: () => `${adminAuthPaths.prefix}/refresh/logout`,
  mfaVerify: () => `${adminAuthPaths.prefix}/mfa/verify`,
  mfaEnrollment: () => `${adminAuthPaths.prefix}/mfa/enrollment`,
  mfaResetStepUp: (adminAccountId: number) =>
    `/api/admin/admin-accounts/${adminAccountId}/mfa/reset/step-up`,
  mfaReset: (adminAccountId: number) => `/api/admin/admin-accounts/${adminAccountId}/mfa/reset`,
  signupComplete: () => `${adminAuthPaths.prefix}/signup/complete`,
  /** POST — 회원가입 본인인증 직후 같은 본인정보 관리자 계정 사전 검사(토큰 불필요, 세션 미소비) */
  signupIdentityPrecheck: () => `${adminAuthPaths.prefix}/signup/identity-precheck`,
  /** POST — 관리자 등록 계정 첫 로그인 본인인증 확정(Bearer, 임시 비밀번호 상태 허용) */
  identityConfirm: () => `${adminAuthPaths.prefix}/identity/confirm`,
  emailCheck: () => `${adminAuthPaths.prefix}/email/check`,
  emailRecoveryLookup: () => `${adminAuthPaths.prefix}/email-recovery/lookup`,
  /** POST — 본인인증 후 입력 이메일·인증 정보가 같은 관리자 계정인지 확인 */
  passwordResetEligibility: () => `${adminAuthPaths.prefix}/password-reset/eligibility`,
  passwordResetConfirm: () => `${adminAuthPaths.prefix}/password-reset/confirm`,
  passwordChange: () => `${adminAuthPaths.prefix}/password/change`,
} as const

/** GNB 계정 — `GET /api/admin/me` */
export const adminMePath = () => '/api/admin/me'
/** 내 정보 확인 — 본인인증 재인증 후 휴대폰 번호 반영 (`PATCH`) */
export const adminMeIdentityContactPath = () => '/api/admin/me/identity-contact'
