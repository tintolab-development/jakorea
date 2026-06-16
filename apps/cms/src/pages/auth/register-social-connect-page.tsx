/**
 * 회원가입 후 소셜 계정 연결 페이지
 */

import { useNavigate } from 'react-router-dom'

import { RegisterSocialConnectView } from '@/features/auth/ui/admin-register/register-social-connect-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'

import './register-social-connect-page.css'

function buildLoginPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/login'
  }
  return `/login?redirect=${encodeURIComponent(redirectPath)}`
}

export function RegisterSocialConnectPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()

  const loginPath = buildLoginPath(params.redirect)

  const handleFinish = () => {
    navigate(loginPath, { replace: true })
  }

  return (
    <AuthPageShell cardClassName="auth-card--register-social-connect">
      <RegisterSocialConnectView onComplete={handleFinish} onSkip={handleFinish} />
    </AuthPageShell>
  )
}
