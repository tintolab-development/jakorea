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
  refresh: () => `${adminAuthPaths.prefix}/refresh`,
  mfaVerify: () => `${adminAuthPaths.prefix}/mfa/verify`,
  mfaEnrollment: () => `${adminAuthPaths.prefix}/mfa/enrollment`,
  signupComplete: () => `${adminAuthPaths.prefix}/signup/complete`,
  emailCheck: () => `${adminAuthPaths.prefix}/email/check`,
  emailRecoveryLookup: () => `${adminAuthPaths.prefix}/email-recovery/lookup`,
  passwordResetConfirm: () => `${adminAuthPaths.prefix}/password-reset/confirm`,
} as const
