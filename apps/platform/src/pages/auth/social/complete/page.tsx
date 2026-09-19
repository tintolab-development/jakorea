import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { processSocialLoginSessionReturn } from '@jakorea/social-auth'
import {
  expiresAtFromExpiresInSeconds,
} from '@/features/auth/sign-in'
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
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function SocialLoginCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const redirectAfterLogin = () => searchParams.get('redirect') ?? '/'

    const execute = async () => {
      if (!isPortalSocialAuthLoginRemoteEnabled()) {
        navigate('/auth/sign-in', { replace: true })
        return
      }

      const params = new URLSearchParams(window.location.search)
      const outcome = await processSocialLoginSessionReturn(platformSocialAuthClient, params)

      switch (outcome.kind) {
        case 'cancelled':
          navigate('/auth/sign-in', { replace: true })
          return

        case 'failed':
          navigate(
            `/auth/sign-in?socialError=${encodeURIComponent(outcome.message)}`,
            { replace: true }
          )
          return

        case 'not_linked':
          navigate('/auth/social/error?reason=not-linked', { replace: true })
          return

        case 'already_linked':
          navigate('/auth/social/error?reason=already-linked', { replace: true })
          return

        case 'mfa_required':
          navigate('/auth/sign-in?socialError=mfa', { replace: true })
          return

        case 'authenticated': {
          queryClient.removeQueries({ queryKey: platformQueryKeys.auth.me() })
          queryClient.removeQueries({ queryKey: platformQueryKeys.auth.memberProfile() })
          setAuthTokens({
            accessToken: outcome.tokens.accessToken,
            refreshToken: outcome.tokens.refreshToken,
            expiresAt: expiresAtFromExpiresInSeconds(outcome.tokens.expiresInSeconds),
          })
          setDevMemberProfile('individual')
          setDevAuthLoggedIn(false)
          navigate(redirectAfterLogin(), { replace: true })
          return
        }

        default:
          navigate('/auth/sign-in', { replace: true })
      }
    }

    void execute().catch(() => {
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      navigate('/auth/sign-in?socialError=unexpected', { replace: true })
    })
  }, [navigate, searchParams])

  return (
    <section className={styles.loading}>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
        소셜 로그인 처리 중…
      </PFText>
    </section>
  )
}
