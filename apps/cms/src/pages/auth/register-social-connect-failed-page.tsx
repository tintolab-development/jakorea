/**
 * 회원가입 후 소셜 계정 연결 실패 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  buildRegisterSocialConnectPath,
} from '@/features/auth/lib/register-social-connect-state'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { RegisterSocialConnectFailedView } from '@/features/auth/ui/admin-register/register-social-connect-failed-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'

import './register-social-connect-failed-page.css'

function buildLoginPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/login'
  }
  return `/login?redirect=${encodeURIComponent(redirectPath)}`
}

export function RegisterSocialConnectFailedPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()

  const loginPath = buildLoginPath(params.redirect)
  const socialConnectPath = buildRegisterSocialConnectPath(params.redirect)

  useEffect(() => {
    if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
      navigate(loginPath, { replace: true })
    }
  }, [loginPath, navigate])

  if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-social-connect-failed">
      <RegisterSocialConnectFailedView
        onRetry={() => navigate(socialConnectPath, { replace: true })}
        onSkipLogin={() => navigate(loginPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
