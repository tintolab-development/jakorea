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
  activity: () => `${adminAuthPaths.prefix}/activity`,
  session: () => `${adminAuthPaths.prefix}/session`,
  refresh: () => `${adminAuthPaths.prefix}/refresh`,
  /** HttpOnly refresh 쿠키(`JA_ADMIN_RT`) 폐기·삭제 (QA-0137, 본문 없음) */
  refreshLogout: () => `${adminAuthPaths.prefix}/refresh/logout`,
  mfaVerify: () => `${adminAuthPaths.prefix}/mfa/verify`,
  mfaEnrollment: () => `${adminAuthPaths.prefix}/mfa/enrollment`,
  passwordChange: () => `${adminAuthPaths.prefix}/password/change`,
} as const

/** CMS 계정(내 정보) — Homepage CRUD와 분리. Vite/PROD에서 CMS origin으로 보냄 */
export const cmsAdminMePaths = {
  me: () => '/api/admin/me',
  marketingConsent: () => '/api/admin/me/marketing-consent',
  identityContact: () => '/api/admin/me/identity-contact',
  withdrawals: () => '/api/admin/me/withdrawals',
} as const

export const cmsPublicTermsDocumentPaths = {
  current: (termsType: string) =>
    `/api/public/terms-documents/${encodeURIComponent(termsType)}/current`,
} as const
