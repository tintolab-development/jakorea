import { expiresAtFromExpiresInSeconds, postPortalLogin } from '@/features/auth/sign-in'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/lib/query-client'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'
import { setAuthTokens } from '@/shared/lib/auth-token'

/**
 * 관리자 등록 최초 로그인 — 비밀번호 변경 후 세션이 끊겨도
 * 로그인 화면으로 보내지 않고 새 비밀번호로 토큰만 갱신한다.
 */
export async function continueAdminRegisteredSessionAfterPasswordChange(input: {
  email: string
  password: string
}) {
  const tokens = await postPortalLogin({
    email: input.email.trim(),
    password: input.password,
  })

  queryClient.removeQueries({ queryKey: platformQueryKeys.auth.me() })
  queryClient.removeQueries({ queryKey: platformQueryKeys.auth.memberProfile() })

  setAuthTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: expiresAtFromExpiresInSeconds(tokens.expiresInSeconds),
  })
  setAdminOnboardingRequired(true)
}
