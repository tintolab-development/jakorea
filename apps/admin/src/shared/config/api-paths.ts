/**
 * Admin API path helpers
 */

const trimEnv = (value: string | undefined, fallback: string): string =>
  (value?.trim().replace(/\/$/, '') || fallback).replace(/\/$/, '') || fallback

/** 관리자 인증·인가 (`/api/admin/auth/...`) — CMS와 동일 계약 */
export const adminAuthPaths = {
  /** env `VITE_ADMIN_AUTH_API_PREFIX` 로 prefix 덮어쓰기 가능 (기본 `/api/admin/auth`) */
  prefix: trimEnv(
    import.meta.env.VITE_ADMIN_AUTH_API_PREFIX as string | undefined,
    '/api/admin/auth'
  ),
  login: () => `${adminAuthPaths.prefix}/login`,
  logout: () => `${adminAuthPaths.prefix}/logout`,
  refresh: () => `${adminAuthPaths.prefix}/refresh`,
  mfaVerify: () => `${adminAuthPaths.prefix}/mfa/verify`,
  mfaEnrollment: () => `${adminAuthPaths.prefix}/mfa/enrollment`,
} as const
