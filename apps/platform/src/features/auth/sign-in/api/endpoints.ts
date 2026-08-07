/** 포털 회원 인증 PUBLIC/세션 API 경로 (`/api/portal/auth/**`) */

export const portalAuthPaths = {
  login: () => '/api/portal/auth/login',
  refresh: () => '/api/portal/auth/refresh',
  logout: () => '/api/portal/auth/logout',
  me: () => '/api/portal/auth/me',
} as const

/** 포털 회원 본인 리소스 (`/api/portal/me/**`) */
export const portalMePaths = {
  profile: () => '/api/portal/me/profile',
} as const
