/**
 * Admin SSO API thin fetcher — 비즈니스 로직은 `@jakorea/social-auth` adapter에 위임합니다.
 */

export { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
export { isSocialAuthRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
export { adminSocialAuthPaths } from '@/shared/config/social-auth-paths'
