/**
 * 최초 로그인 — 비밀번호 변경 완료
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  buildRegisterSocialConnectPath,
  SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED,
} from '@/features/auth/lib/register-social-connect-state'
import {
  clearPasswordChangeRequiredComplete,
  clearPasswordChangeRequiredSocialOnboarding,
  clearPasswordChangeRequiredWizardState,
  hasPasswordChangeRequiredComplete,
  markPasswordChangeRequiredSocialOnboarding,
  PasswordChangeRequiredCompleteView,
} from '@/features/auth/password-change-required'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'

import './password-change-required-complete-page.css'

export function PasswordChangeRequiredCompletePage() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const clearPasswordChangeRequired = useAuthStore(state => state.clearPasswordChangeRequired)
  const allowed = hasPasswordChangeRequiredComplete()

  useEffect(() => {
    if (!allowed) return
    clearPasswordChangeRequiredWizardState()
  }, [allowed])

  const handleGoLogin = () => {
    clearPasswordChangeRequiredComplete()
    clearPasswordChangeRequiredSocialOnboarding()
    clearPasswordChangeRequired()
    logout()
    navigate('/login', { replace: true })
  }

  const handleConnectSocial = () => {
    // 소셜 온보딩 잠금을 먼저 건 뒤 complete/passwordChangeRequired를 지운다.
    // 잠금 없이 지우면 가드·ProtectedRoute가 대시보드(`/`)로 보낸다.
    markPasswordChangeRequiredSocialOnboarding()
    clearPasswordChangeRequiredComplete()
    clearPasswordChangeRequired()
    navigate(
      buildRegisterSocialConnectPath(undefined, {
        flow: SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED,
      }),
      { replace: true }
    )
  }

  if (!allowed) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--password-change-required-complete">
      <PasswordChangeRequiredCompleteView
        onGoLogin={handleGoLogin}
        onConnectSocial={handleConnectSocial}
      />
    </AuthPageShell>
  )
}
