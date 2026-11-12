import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { processSocialLoginSessionReturn } from '@jakorea/social-auth'
import {
  beginAgeTransitionLoginScope,
  resolvePostLoginPath,
} from '@/features/auth/age-transition'
import { expiresAtFromExpiresInSeconds } from '@/features/auth/sign-in'
import { applyAuthTokenAgeGroupToMeCache } from '@/features/auth/sign-in/lib/apply-auth-token-age-group'
import {
  isPortalSocialAuthLoginRemoteEnabled,
  platformSocialAuthClient,
} from '@/features/auth/social-auth'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  clearAuthTokens,
  queryClient,
  setAuthTokens,
  setDevAuthLoggedIn,
  setDevMemberProfile,
} from '@/shared/lib'
import { PFLoadingSpinner } from '@/shared/ui'
import {
  resolveSocialLoginReturnPath,
  sanitizeLoginRedirectPath,
} from '@/shared/lib/login-redirect'

export function SocialLoginCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    // 완료 URL의 redirect 우선, 없으면 소셜 로그인 시작 시 보관한 returnUrl(login intent)
    const oauthState = platformSocialAuthClient.state
    const redirectAfterLogin = () =>
      resolveSocialLoginReturnPath({
        queryRedirect: searchParams.get('redirect'),
        oauthIntent: oauthState.getOAuthIntent(),
        storedReturnUrl: oauthState.getReturnUrl(),
      })
    /** 실패·취소로 로그인 화면에 돌아갈 때도 원래 화면을 redirect로 유지 */
    const signInPath = (socialError?: string) => {
      const query = new URLSearchParams()
      if (socialError) query.set('socialError', socialError)
      const redirect = redirectAfterLogin()
      if (sanitizeLoginRedirectPath(redirect)) query.set('redirect', redirect)
      const qs = query.toString()
      return qs ? `/auth/sign-in?${qs}` : '/auth/sign-in'
    }

    const execute = async () => {
      if (!isPortalSocialAuthLoginRemoteEnabled()) {
        navigate('/auth/sign-in', { replace: true })
        return
      }

      const params = new URLSearchParams(window.location.search)
      const outcome = await processSocialLoginSessionReturn(platformSocialAuthClient, params)

      switch (outcome.kind) {
        case 'cancelled':
          navigate(signInPath(), { replace: true })
          return

        case 'failed':
          navigate(signInPath(outcome.message), { replace: true })
          return

        case 'not_linked':
          navigate('/auth/social/error?reason=not-linked', { replace: true })
          return

        case 'already_linked':
          navigate('/auth/social/error?reason=already-linked', { replace: true })
          return

        case 'mfa_required':
          navigate(signInPath('mfa'), { replace: true })
          return

        case 'authenticated': {
          queryClient.removeQueries({ queryKey: platformQueryKeys.auth.me() })
          queryClient.removeQueries({ queryKey: platformQueryKeys.auth.memberProfile() })
          queryClient.removeQueries({ queryKey: platformQueryKeys.auth.ageTransition() })
          beginAgeTransitionLoginScope()
          setAuthTokens({
            accessToken: outcome.tokens.accessToken,
            refreshToken: outcome.tokens.refreshToken,
            expiresAt: expiresAtFromExpiresInSeconds(outcome.tokens.expiresInSeconds),
          })
          applyAuthTokenAgeGroupToMeCache(outcome.tokens.ageGroup)
          setDevMemberProfile('individual')
          setDevAuthLoggedIn(false)
          const nextPath = await resolvePostLoginPath(redirectAfterLogin())
          // 로그인 완료 — 보관한 intent·returnUrl 정리 (다음 소셜 로그인에 남지 않도록)
          oauthState.clearOAuthIntent()
          navigate(nextPath, { replace: true })
          return
        }

        default:
          navigate(signInPath(), { replace: true })
      }
    }

    void execute().catch(() => {
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      navigate(signInPath('unexpected'), { replace: true })
    })
  }, [navigate, searchParams])

  return <PFLoadingSpinner centered label="소셜 로그인 처리 중" />
}
