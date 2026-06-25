/**
 * 회원가입 후 소셜 계정 연결 페이지
 */

import { useNavigate } from 'react-router-dom'

import { buildRegisterSocialConnectCompletePath } from '@/features/auth/lib/register-social-connect-state'
import { RegisterSocialConnectView } from '@/features/auth/ui/admin-register/register-social-connect-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useAuthStore } from '@/features/auth/model/auth-store'
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
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  const loginPath = buildLoginPath(params.redirect)
  const finishPath = isAuthenticated ? params.redirect || '/' : loginPath

  const handleFinish = () => {
    navigate(finishPath, { replace: true })
  }

  const handleConnectSuccess = () => {
    navigate(buildRegisterSocialConnectCompletePath(params.redirect), { replace: true })
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-social-connect">
      <RegisterSocialConnectView
        redirectPath={params.redirect}
        onComplete={handleFinish}
        onSkip={handleFinish}
        onConnectSuccess={handleConnectSuccess}
      />
    </AuthPageShell>
  )
}
