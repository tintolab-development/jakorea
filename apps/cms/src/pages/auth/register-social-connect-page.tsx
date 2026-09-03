/**
 * 회원가입 후 소셜 계정 연결 페이지
 */

import { useNavigate } from 'react-router-dom'

import {
  buildRegisterCompletePath,
  buildRegisterSocialConnectCompletePath,
  buildSocialConnectCompletePath,
  normalizeSocialConnectRedirectPath,
  resolveSocialConnectFinishPath,
} from '@/features/auth/lib/register-social-connect-state'
import { RegisterSocialConnectView } from '@/features/auth/ui/admin-register/register-social-connect-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'

import './register-social-connect-page.css'

export function RegisterSocialConnectPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const fallbackPath = getRedirectPathByRole(user)
  const safeRedirectPath = normalizeSocialConnectRedirectPath(params.redirect, fallbackPath)

  const finishPath = resolveSocialConnectFinishPath({
    isAuthenticated,
    redirectPath: params.redirect,
    fallbackPath,
  })

  const handleFinish = () => {
    if (!isAuthenticated) {
      navigate(buildRegisterCompletePath(params.redirect), { replace: true })
      return
    }

    navigate(finishPath, { replace: true })
  }

  const handleConnectSuccess = () => {
    const completePath = isAuthenticated
      ? buildSocialConnectCompletePath(safeRedirectPath)
      : buildRegisterSocialConnectCompletePath(params.redirect)
    navigate(completePath, { replace: true })
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-social-connect">
      <RegisterSocialConnectView
        redirectPath={safeRedirectPath}
        onComplete={handleFinish}
        onSkip={handleFinish}
        onConnectSuccess={handleConnectSuccess}
      />
    </AuthPageShell>
  )
}
