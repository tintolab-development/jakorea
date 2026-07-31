/** 포털 회원 인증 PUBLIC/세션 API 경로 (`/api/portal/auth/**`) */

export const portalAuthPaths = {
  login: () => '/api/portal/auth/login',
  refresh: () => '/api/portal/auth/refresh',
  logout: () => '/api/portal/auth/logout',
  me: () => '/api/portal/auth/me',
} as const
