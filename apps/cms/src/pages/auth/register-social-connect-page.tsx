/**
 * 회원가입 후 소셜 계정 연결 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  buildRegisterCompletePath,
  buildRegisterSocialConnectCompletePath,
  buildRegisterSocialConnectPath,
  buildSocialConnectCompletePath,
  isPasswordChangeRequiredSocialConnectFlow,
  normalizeSocialConnectRedirectPath,
  resolveSocialConnectFinishPath,
  SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED,
} from '@/features/auth/lib/register-social-connect-state'
import { RegisterSocialConnectView } from '@/features/auth/ui/admin-register/register-social-connect-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  clearPasswordChangeRequiredComplete,
  hasPasswordChangeRequiredSocialOnboarding,
  markPasswordChangeRequiredSocialOnboarding,
} from '@/features/auth/password-change-required'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'

import './register-social-connect-page.css'

export function RegisterSocialConnectPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string; flow?: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const fallbackPath = getRedirectPathByRole(user)
  const passwordChangeOnboarding = isPasswordChangeRequiredSocialConnectFlow(params.flow)
  // 비번변경 온보딩에서는 redirect를 `/`로 정규화하지 않음 (OAuth returnUrl·완료 이동이 메인으로 새는 것 방지)
  const safeRedirectPath = passwordChangeOnboarding
    ? undefined
    : normalizeSocialConnectRedirectPath(params.redirect, fallbackPath)

  useEffect(() => {
    if (passwordChangeOnboarding) {
      markPasswordChangeRequiredSocialOnboarding()
      clearPasswordChangeRequiredComplete()
      return
    }
    // flow 없이 진입했는데 소셜 온보딩 잠금만 남은 경우 → flow 경로로 보정
    if (hasPasswordChangeRequiredSocialOnboarding()) {
      navigate(
        buildRegisterSocialConnectPath(undefined, {
          flow: SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED,
        }),
        { replace: true }
      )
    }
  }, [passwordChangeOnboarding, navigate])

  const finishPath = resolveSocialConnectFinishPath({
    isAuthenticated,
    redirectPath: params.redirect,
    fallbackPath,
  })

  const handleFinish = () => {
    // 최초 비번변경 온보딩·미로그인 가입: 가입 완료 화면 (비밀번호 변경 완료로 되돌리지 않음)
    if (passwordChangeOnboarding || !isAuthenticated) {
      navigate(buildRegisterCompletePath(), { replace: true })
      return
    }

    navigate(finishPath, { replace: true })
  }

  const handleConnectSuccess = () => {
    if (passwordChangeOnboarding) {
      navigate(
        buildRegisterSocialConnectCompletePath(undefined, {
          flow: SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED,
        }),
        { replace: true }
      )
      return
    }
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
        onConnectSuccess={handleConnectSuccess}
        skipRemoteSync={passwordChangeOnboarding}
      />
    </AuthPageShell>
  )
}
