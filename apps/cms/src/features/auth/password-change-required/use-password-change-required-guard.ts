/**
 * passwordChangeRequired 위저드 페이지 공통 가드
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  hasPasswordChangeRequiredComplete,
  hasPasswordChangeRequiredSocialOnboarding,
} from '@/features/auth/password-change-required/wizard-state'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

export function resolvePasswordChangeRequiredGuardPath(input: {
  complete: boolean
  socialOnboarding: boolean
  isAuthenticated: boolean
  hasUser: boolean
  passwordChangeRequired: boolean
  dashboardPath: string
}): string | null {
  if (input.socialOnboarding) {
    return passwordChangeRequiredPaths.socialConnect
  }
  if (input.complete) {
    return passwordChangeRequiredPaths.complete
  }
  if (!input.isAuthenticated || !input.hasUser) {
    return '/login'
  }
  if (!input.passwordChangeRequired) {
    return input.dashboardPath
  }
  return null
}

export function usePasswordChangeRequiredGuard() {
  const navigate = useNavigate()
  const { isAuthenticated, passwordChangeRequired, user } = useAuthStore()

  useEffect(() => {
    const nextPath = resolvePasswordChangeRequiredGuardPath({
      complete: hasPasswordChangeRequiredComplete(),
      socialOnboarding: hasPasswordChangeRequiredSocialOnboarding(),
      isAuthenticated,
      hasUser: Boolean(user),
      passwordChangeRequired,
      dashboardPath: getRedirectPathByRole(user),
    })
    if (nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [isAuthenticated, passwordChangeRequired, user, navigate])

  return {
    isReady: Boolean(
      (isAuthenticated && passwordChangeRequired && user) ||
        hasPasswordChangeRequiredComplete() ||
        hasPasswordChangeRequiredSocialOnboarding()
    ),
    user,
    noticePath: passwordChangeRequiredPaths.notice,
  }
}
