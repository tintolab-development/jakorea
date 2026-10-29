/**
 * 로그인 후 소셜 계정 연결 완료 페이지 (내 정보 수정 등)
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  buildRegisterSocialConnectPath,
  normalizeSocialConnectRedirectPath,
} from '@/features/auth/lib/register-social-connect-state'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { SocialConnectCompleteView } from '@/features/auth/ui/social-connect-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'

import './register-complete-page.css'

function resolveMaskedAccountEmail(email?: string | null): string {
  const trimmed = email?.trim()
  if (!trimmed) return '-'
  return MASKING_POLICY.email(trimmed)
}

export function SocialConnectCompletePage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const user = useAuthStore(state => state.user)
  const fallbackPath = getRedirectPathByRole(user)
  const homePath = normalizeSocialConnectRedirectPath(params.redirect, fallbackPath) ?? fallbackPath
  const socialConnectPath = buildRegisterSocialConnectPath(homePath)
  const maskedEmail = resolveMaskedAccountEmail(user?.email)

  useEffect(() => {
    if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
      navigate(homePath, { replace: true })
    }
  }, [homePath, navigate])

  if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-complete">
      <SocialConnectCompleteView
        maskedEmail={maskedEmail}
        onGoLogin={() => navigate(homePath, { replace: true })}
        onConnectMore={() => navigate(socialConnectPath, { replace: true })}
      />
    </AuthPageShell>
  )
}
