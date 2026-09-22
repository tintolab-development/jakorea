import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePortalMeQuery } from '@/features/auth/sign-in'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  resolveAdminProvisionedStepFromPathname,
  shouldRedirectAdminProvisionedOnboardingStep,
  type AdminProvisionedOnboardingFlags,
} from '../lib/onboarding-step'
import { getAdminRegisteredWizardState } from '../model/wizard-state'
import { syncAdminRegisteredOnboardingSession } from '../lib/sync-onboarding-session'

function toOnboardingFlags(data: {
  email?: string
  registeredByAdmin?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}): AdminProvisionedOnboardingFlags {
  return {
    registeredByAdmin: data.registeredByAdmin,
    adminProvisionedOnboardingRequired: data.adminProvisionedOnboardingRequired,
    adminProvisionedOnboardingStep: data.adminProvisionedOnboardingStep,
    identitySelfSignupCompletedAfterAdminRegistration:
      data.identitySelfSignupCompletedAfterAdminRegistration,
  }
}

function ensureWizardFromMe(me: {
  email?: string
  registeredByAdmin?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}) {
  const email = me.email?.trim()
  if (!email) return
  syncAdminRegisteredOnboardingSession(email, toOnboardingFlags(me), 'first-login')
}

/**
 * Remote API — `adminProvisionedOnboardingStep` 과 현재 경로를 맞춘다.
 * mock 모드에서는 no-op.
 */
export function useAdminProvisionedOnboardingStepGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const pageStep = resolveAdminProvisionedStepFromPathname(location.pathname)
  const enabled = remote && hasToken && pageStep != null

  const meQuery = usePortalMeQuery({ enabled })
  const me = meQuery.data

  if (me) {
    ensureWizardFromMe(me)
  }

  const isChecking = enabled && meQuery.isPending && !me
  const hasWizard = Boolean(getAdminRegisteredWizardState()?.email)

  useEffect(() => {
    if (!remote) return
    if (isChecking) return

    if (!hasToken && !hasWizard) {
      navigate('/auth/sign-in', { replace: true })
      return
    }

    if (!enabled) return
    if (meQuery.isError && !me) {
      if (!hasWizard) {
        navigate('/auth/sign-in', { replace: true })
      }
      return
    }
    if (!me) return

    const flags = toOnboardingFlags(me)
    const target = shouldRedirectAdminProvisionedOnboardingStep({
      pathname: location.pathname,
      flags,
    })

    if (target && target !== location.pathname) {
      navigate(target, { replace: true })
    }
  }, [
    enabled,
    hasToken,
    hasWizard,
    isChecking,
    location.pathname,
    me,
    meQuery.isError,
    navigate,
    remote,
  ])

  return { isChecking, pageStep }
}
