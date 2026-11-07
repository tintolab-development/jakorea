/** 포털 회원 인증 PUBLIC/세션 API 경로 (`/api/portal/auth/**`) */

export const portalAuthPaths = {
  login: () => '/api/portal/auth/login',
  refresh: () => '/api/portal/auth/refresh',
  logout: () => '/api/portal/auth/logout',
  me: () => '/api/portal/auth/me',
  /** POST — MEMBER Bearer, 본문 없음. 실제 사용자 활동 기록 (BE 60초 기록 억제) */
  activity: () => '/api/portal/auth/activity',
  /** GET — MEMBER Bearer. 조회 전용(활동·Refresh 미발생), Cache-Control: no-store */
  session: () => '/api/portal/auth/session',
  emailCheck: () => '/api/portal/auth/email/check',
  emailRecoveryLookup: () => '/api/portal/auth/email-recovery/lookup',
  passwordChange: () => '/api/portal/auth/password/change',
  passwordResetConfirm: () => '/api/portal/auth/password-reset/confirm',
  adminProvisionedProfile: () => '/api/portal/auth/admin-provisioned/profile',
  adminProvisionedIdentityConfirm: () => '/api/portal/auth/admin-provisioned/identity/confirm',
  adminProvisionedComplete: () => '/api/portal/auth/admin-provisioned/complete',
} as const

/** 포털 회원 본인 리소스 (`/api/portal/me/**`) */
export const portalMePaths = {
  profile: () => '/api/portal/me/profile',
  phoneIdentityConfirm: () => '/api/portal/me/phone/identity/confirm',
  instructorRoleRequests: () => '/api/portal/me/instructor-role-requests',
  instructorRoleRequestCurrent: () => '/api/portal/me/instructor-role-requests/current',
  /** GET — 내 강사 권한 신청 제출 스냅샷 (승인 대기 읽기 전용 화면) */
  instructorRoleRequestCurrentDetail: () =>
    '/api/portal/me/instructor-role-requests/current/detail',
  /** POST /api/portal/me/withdrawals — OpenAPI `withdraw` */
  withdrawals: () => '/api/portal/me/withdrawals',
  /** GET /api/portal/me/form-responses/{formResponseId}/feedback — Wave11 ISSUANCE 포함 */
  formResponseFeedback: (formResponseId: number) =>
    `/api/portal/me/form-responses/${formResponseId}/feedback`,
} as const
