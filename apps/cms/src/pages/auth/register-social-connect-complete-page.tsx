/**
 * 회원가입 후 소셜 계정 연결 완료 페이지
 */

import { useNavigate } from 'react-router-dom'

import { RegisterSocialConnectCompleteView } from '@/features/auth/ui/admin-register/register-social-connect-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { buildRegisterSocialConnectPath } from '@/features/auth/lib/register-social-connect-state'
import { useQueryParams } from '@/shared/hooks/use-query-params'

import './register-complete-page.css'

function buildLoginPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/login'
  }
  return `/login?redirect=${encodeURIComponent(redirectPath)}`
}

export function RegisterSocialConnectCompletePage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()

  const loginPath = buildLoginPath(params.redirect)
  const socialConnectPath = buildRegisterSocialConnectPath(params.redirect)

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-complete">
      <RegisterSocialConnectCompleteView
        onGoLogin={() => navigate(loginPath, { replace: true })}
        onConnectMore={() => navigate(socialConnectPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
