/** 포털 회원 인증 PUBLIC/세션 API 경로 (`/api/portal/auth/**`) */

export const portalAuthPaths = {
  login: () => '/api/portal/auth/login',
  refresh: () => '/api/portal/auth/refresh',
  logout: () => '/api/portal/auth/logout',
  me: () => '/api/portal/auth/me',
  emailCheck: () => '/api/portal/auth/email/check',
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
} as const
