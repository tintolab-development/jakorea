import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalMeQuery } from '@/features/auth/sign-in'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  isAdminOnboardingRequired,
  setAdminOnboardingRequired,
  setDevAuthLoggedIn,
} from '@/shared/lib'
import { ADMIN_REGISTERED_NOTICE_PATH } from '../lib/constants'
import {
  requiresAdminRegisteredOnboarding,
  setAdminRegisteredPasswordChangeRequired,
} from '../lib/admin-registered-member'

/**
 * 마이페이지 진입 시 GET /me 기준으로 관리자 등록 안내 화면으로 보낸다.
 * registeredByAdmin true && identitySelfSignupCompletedAfterAdminRegistration false 만 해당.
 */
export function useAdminRegisteredNoticeRedirect() {
  const navigate = useNavigate()
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = remote && hasToken
  const meQuery = usePortalMeQuery({ enabled })

  const isChecking = enabled && meQuery.isPending && !meQuery.data
  const shouldRedirect = Boolean(
    enabled && meQuery.data && requiresAdminRegisteredOnboarding(meQuery.data),
  )

  useEffect(() => {
    if (!enabled) return
    if (meQuery.isPending && !meQuery.data) return
    if (meQuery.isError && !meQuery.data) return

    const me = meQuery.data
    if (!me) return

    if (requiresAdminRegisteredOnboarding(me)) {
      if (me.email?.trim()) {
        setAdminRegisteredPasswordChangeRequired(me.email)
      } else {
        setAdminOnboardingRequired(true)
      }
      navigate(ADMIN_REGISTERED_NOTICE_PATH, { replace: true })
      return
    }

    if (isAdminOnboardingRequired()) {
      setAdminOnboardingRequired(false)
      setDevAuthLoggedIn(true)
    }
  }, [enabled, meQuery.data, meQuery.isError, meQuery.isPending, navigate])

  return { isChecking, isRedirecting: shouldRedirect }
}
