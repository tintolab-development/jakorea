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
import { updateAdminRegisteredWizardState } from '../model/wizard-state'
import { normalizeAdminProvisionedOnboardingStep } from '../lib/onboarding-step'

function toOnboardingFlags(data: {
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

  const isChecking = enabled && meQuery.isPending && !meQuery.data

  useEffect(() => {
    if (!enabled) return
    if (meQuery.isPending && !meQuery.data) return
    if (meQuery.isError && !meQuery.data) return

    const me = meQuery.data
    if (!me) return

    const flags = toOnboardingFlags(me)
    const step = normalizeAdminProvisionedOnboardingStep(me.adminProvisionedOnboardingStep)
    if (step) {
      updateAdminRegisteredWizardState({ adminProvisionedOnboardingStep: step })
    }

    const target = shouldRedirectAdminProvisionedOnboardingStep({
      pathname: location.pathname,
      flags,
    })

    if (target && target !== location.pathname) {
      navigate(target, { replace: true })
    }
  }, [
    enabled,
    location.pathname,
    meQuery.data,
    meQuery.isError,
    meQuery.isPending,
    navigate,
  ])

  return { isChecking, pageStep }
}
