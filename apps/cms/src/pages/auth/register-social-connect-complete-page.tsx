/**
 * 회원가입 후 소셜 계정 연결 완료 페이지
 */

import { useNavigate } from 'react-router-dom'

import { RegisterSocialConnectCompleteView } from '@/features/auth/ui/admin-register/register-social-connect-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import {
  buildRegisterSocialConnectPath,
  resolveSocialConnectFinishPath,
} from '@/features/auth/lib/register-social-connect-state'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'

import './register-complete-page.css'

export function RegisterSocialConnectCompletePage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const fallbackPath = getRedirectPathByRole(user)

  const finishPath = resolveSocialConnectFinishPath({
    isAuthenticated,
    redirectPath: params.redirect,
    fallbackPath,
  })
  const socialConnectPath = buildRegisterSocialConnectPath(
    isAuthenticated ? fallbackPath : params.redirect
  )

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-complete">
      <RegisterSocialConnectCompleteView
        onGoLogin={() => navigate(finishPath, { replace: true })}
        onConnectMore={() => navigate(socialConnectPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
