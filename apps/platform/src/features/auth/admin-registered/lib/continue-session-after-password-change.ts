import {
  expiresAtFromExpiresInSeconds,
  postPortalLogin,
  type PortalPasswordChangeTokens,
} from '@/features/auth/sign-in'
import { applyAuthTokenAgeGroupToMeCache } from '@/features/auth/sign-in/lib/apply-auth-token-age-group'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/lib/query-client'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'
import { setAuthTokens } from '@/shared/lib/auth-token'
import { syncAdminRegisteredOnboardingSession } from './sync-onboarding-session'

/**
 * 관리자 등록 최초 로그인 — 비밀번호 변경 후 로그인 화면으로 보내지 않고 온보딩을 이어간다.
 *
 * BE `/password/change`는 기존 세션을 폐기하고 새 `AuthTokenResponse`를 즉시 반환한다.
 * 그 토큰은 `usePortalPasswordChangeMutation` 성공 시 이미 저장됐으므로 여기서는 온보딩 상태만 맞춘다
 * (새 비밀번호로 `/login`을 다시 호출하지 않는다).
 *
 * `changeTokens`가 null이면(토큰을 주지 않는 구 BE 계약) 기존처럼 새 비밀번호 로그인으로 세션을 잇는다.
 */
export async function continueAdminRegisteredSessionAfterPasswordChange(input: {
  email: string
  password: string
  changeTokens: PortalPasswordChangeTokens | null
}) {
  const tokens = input.changeTokens ?? (await loginWithNewPassword(input.email, input.password))

  syncAdminRegisteredOnboardingSession(input.email, tokens, 'first-login')
  setAdminOnboardingRequired(true)

  return tokens
}

async function loginWithNewPassword(email: string, password: string) {
  const tokens = await postPortalLogin({ email: email.trim(), password })

  queryClient.removeQueries({ queryKey: platformQueryKeys.auth.me() })
  queryClient.removeQueries({ queryKey: platformQueryKeys.auth.memberProfile() })

  setAuthTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: expiresAtFromExpiresInSeconds(tokens.expiresInSeconds),
  })
  applyAuthTokenAgeGroupToMeCache(tokens.ageGroup)
  return tokens
}
