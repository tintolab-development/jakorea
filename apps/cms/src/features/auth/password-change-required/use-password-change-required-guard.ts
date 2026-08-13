/**
 * passwordChangeRequired 위저드 페이지 공통 가드
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

export function usePasswordChangeRequiredGuard() {
  const navigate = useNavigate()
  const { isAuthenticated, passwordChangeRequired, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
      return
    }
    if (!passwordChangeRequired) {
      navigate(getRedirectPathByRole(user), { replace: true })
    }
  }, [isAuthenticated, passwordChangeRequired, user, navigate])

  return {
    isReady: Boolean(isAuthenticated && passwordChangeRequired && user),
    user,
    noticePath: passwordChangeRequiredPaths.notice,
  }
}
