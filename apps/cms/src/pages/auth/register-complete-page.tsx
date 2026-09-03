/**
 * 회원가입 완료 페이지
 */

import { useNavigate } from 'react-router-dom'

import { RegisterCompleteView } from '@/features/auth/ui/admin-register/register-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'

import './register-complete-page.css'

function buildLoginPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/login'
  }
  return `/login?redirect=${encodeURIComponent(redirectPath)}`
}

function buildSocialConnectPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/social-connect'
  }
  return `/register/social-connect?redirect=${encodeURIComponent(redirectPath)}`
}

export function RegisterCompletePage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()

  const loginPath = buildLoginPath(params.redirect)
  const socialConnectPath = buildSocialConnectPath(params.redirect)

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-complete auth-card--register-signup-complete">
      <RegisterCompleteView
        onGoLogin={() => navigate(loginPath, { replace: true })}
        onConnectSocial={() => navigate(socialConnectPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
