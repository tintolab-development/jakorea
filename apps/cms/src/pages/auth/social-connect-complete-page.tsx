/**
 * 로그인 후 소셜 계정 연결 완료 페이지 (내 정보 수정 등)
 */

import { useNavigate } from 'react-router-dom'

import {
  buildRegisterSocialConnectPath,
  normalizeSocialConnectRedirectPath,
} from '@/features/auth/lib/register-social-connect-state'
import { SocialConnectCompleteView } from '@/features/auth/ui/social-connect-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'

import './register-complete-page.css'

export function SocialConnectCompletePage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const user = useAuthStore(state => state.user)
  const fallbackPath = getRedirectPathByRole(user)
  const homePath = normalizeSocialConnectRedirectPath(params.redirect, fallbackPath) ?? fallbackPath
  const socialConnectPath = buildRegisterSocialConnectPath(homePath)

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-complete">
      <SocialConnectCompleteView
        onGoHome={() => navigate(homePath, { replace: true })}
        onConnectMore={() => navigate(socialConnectPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
