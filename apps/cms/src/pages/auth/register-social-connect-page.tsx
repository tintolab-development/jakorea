/**
 * 로그인 후 소셜 계정 연결 (내 정보 수정 등)
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  buildRegisterSocialConnectPath,
  buildSocialConnectCompletePath,
  normalizeSocialConnectRedirectPath,
  resolveSocialConnectFinishPath,
} from '@/features/auth/lib/register-social-connect-state'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
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
  const socialConnectSelfPath = buildRegisterSocialConnectPath(params.redirect)

  useEffect(() => {
    if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
      navigate(
        isAuthenticated
          ? resolveSocialConnectFinishPath({
              isAuthenticated: true,
              redirectPath: params.redirect,
              fallbackPath,
            })
          : '/login',
        { replace: true }
      )
      return
    }
    if (!isAuthenticated) {
      navigate(
        resolveSocialConnectFinishPath({
          isAuthenticated: false,
          redirectPath: socialConnectSelfPath,
          fallbackPath: '/login',
        }),
        { replace: true }
      )
    }
  }, [
    fallbackPath,
    isAuthenticated,
    navigate,
    params.redirect,
    socialConnectSelfPath,
  ])

  const finishPath = resolveSocialConnectFinishPath({
    isAuthenticated: true,
    redirectPath: params.redirect,
    fallbackPath,
  })

  const handleFinish = () => {
    navigate(finishPath, { replace: true })
  }

  const handleConnectSuccess = () => {
    navigate(buildSocialConnectCompletePath(safeRedirectPath), { replace: true })
  }

  if (!SOCIAL_ACCOUNT_LINK_ENABLED || !isAuthenticated) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--register-social-connect">
      <RegisterSocialConnectView
        redirectPath={safeRedirectPath}
        onComplete={handleFinish}
        onConnectSuccess={handleConnectSuccess}
      />
    </AuthPageShell>
  )
}
