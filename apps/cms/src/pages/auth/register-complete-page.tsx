/**
 * 회원가입 완료 페이지
 */

import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { isSocialConnectAuthFlowPath } from '@/features/auth/lib/register-social-connect-state'
import { clearPasswordChangeRequiredComplete } from '@/features/auth/password-change-required'
import { RegisterCompleteView } from '@/features/auth/ui/admin-register/register-complete-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { isPasswordChangeRequiredPath } from '@/shared/utils/post-auth-redirect'

import './register-complete-page.css'

function resolveSafeAppRedirect(redirectPath?: string): string | undefined {
  if (!redirectPath?.startsWith('/')) return undefined
  const pathname = redirectPath.split('?')[0] ?? ''
  if (isSocialConnectAuthFlowPath(redirectPath) || isPasswordChangeRequiredPath(pathname)) {
    return undefined
  }
  return redirectPath
}

function buildLoginPath(redirectPath?: string) {
  const safe = resolveSafeAppRedirect(redirectPath)
  if (!safe) {
    return '/login'
  }
  return `/login?redirect=${encodeURIComponent(safe)}`
}

export function RegisterCompletePage() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const clearPasswordChangeRequired = useAuthStore(state => state.clearPasswordChangeRequired)
  const { params } = useQueryParams<{ redirect?: string }>()

  const loginPath = buildLoginPath(params.redirect)

  return (
    <AuthPageShell
      showLogo={false}
      cardClassName="auth-card--register-complete auth-card--register-signup-complete"
    >
      <RegisterCompleteView
        onGoLogin={() => {
          clearPasswordChangeRequiredComplete()
          clearPasswordChangeRequired()
          logout()
          navigate(loginPath, { replace: true })
        }}
      />
    </AuthPageShell>
  )
}
