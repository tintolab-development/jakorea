/**
 * 최초 로그인 — 비밀번호 변경 완료
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  clearPasswordChangeRequiredComplete,
  clearPasswordChangeRequiredWizardState,
  hasPasswordChangeRequiredComplete,
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
    clearPasswordChangeRequired()
    logout()
    navigate('/login', { replace: true })
  }

  if (!allowed) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="auth-card--password-change-required-complete">
      <PasswordChangeRequiredCompleteView onGoLogin={handleGoLogin} />
    </AuthPageShell>
  )
}
