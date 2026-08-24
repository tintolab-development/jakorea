import type { HomepageMeResponse } from '@/features/auth/sign-in'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/lib'
import type { AdminProvisionedOnboardingResponse } from '../api/types'
import type { AdminRegisteredEntrySource } from '../model/wizard-state'
import {
  initAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '../model/wizard-state'
import {
  normalizeAdminProvisionedOnboardingStep,
  shouldContinueAdminProvisionedOnboarding,
  type AdminProvisionedOnboardingFlags,
  type AdminProvisionedOnboardingStep,
} from './onboarding-step'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'

export function syncAdminRegisteredOnboardingSession(
  email: string,
  flags: AdminProvisionedOnboardingFlags,
  entrySource: AdminRegisteredEntrySource = 'first-login',
) {
  initAdminRegisteredWizardState(email, entrySource)

  const step = normalizeAdminProvisionedOnboardingStep(flags.adminProvisionedOnboardingStep)
  if (step) {
    updateAdminRegisteredWizardState({ adminProvisionedOnboardingStep: step })
  }

  setAdminOnboardingRequired(shouldContinueAdminProvisionedOnboarding(flags))
}

/** API 응답 step 필드 또는 완료 플래그로 다음 온보딩 단계를 추론한다. */
export function resolveOnboardingStepFromResponse(
  response: AdminProvisionedOnboardingResponse,
): AdminProvisionedOnboardingStep | null {
  const fromApi = normalizeAdminProvisionedOnboardingStep(response.adminProvisionedOnboardingStep)
  if (fromApi) return fromApi

  if (response.identitySelfSignupCompletedAfterAdminRegistration === true) {
    return 'DONE'
  }
  if (response.identityCompleted === true) {
    return 'PASSWORD'
  }
  if (response.profileCompleted === true) {
    return 'IDENTITY'
  }

  return null
}

function buildMeCachePatch(
  response: AdminProvisionedOnboardingResponse,
): Partial<HomepageMeResponse> {
  const patch: Partial<HomepageMeResponse> = {}
  const step = resolveOnboardingStepFromResponse(response)

  if (response.registeredByAdmin !== undefined) {
    patch.registeredByAdmin = response.registeredByAdmin
  }
  if (response.adminProvisionedOnboardingRequired !== undefined) {
    patch.adminProvisionedOnboardingRequired = response.adminProvisionedOnboardingRequired
  }
  if (step) {
    patch.adminProvisionedOnboardingStep = step
  } else if (response.adminProvisionedOnboardingStep !== undefined) {
    patch.adminProvisionedOnboardingStep = response.adminProvisionedOnboardingStep
  }
  if (response.identitySelfSignupCompletedAfterAdminRegistration !== undefined) {
    patch.identitySelfSignupCompletedAfterAdminRegistration =
      response.identitySelfSignupCompletedAfterAdminRegistration
  }
  if (response.passwordChangeRequired !== undefined) {
    patch.passwordChangeRequired = response.passwordChangeRequired
  }

  return patch
}

/** step guard(`usePortalMeQuery`)가 stale step으로 되돌리지 않도록 me 캐시를 갱신한다. */
export function syncAdminProvisionedOnboardingToMeCache(
  response: AdminProvisionedOnboardingResponse,
) {
  const key = platformQueryKeys.auth.me()
  const patch = buildMeCachePatch(response)

  if (Object.keys(patch).length === 0) {
    return
  }

  const current = queryClient.getQueryData<HomepageMeResponse>(key)
  if (current) {
    queryClient.setQueryData(key, { ...current, ...patch })
    return
  }

  queryClient.invalidateQueries({ queryKey: key })
}

export function applyAdminProvisionedOnboardingToWizard(
  response: AdminProvisionedOnboardingResponse,
) {
  const step = resolveOnboardingStepFromResponse(response)
  if (step) {
    updateAdminRegisteredWizardState({ adminProvisionedOnboardingStep: step })
  }
}

/** 온보딩 API 응답을 wizard localStorage + GET /me 쿼리 캐시에 반영한다. */
export function applyAdminProvisionedOnboardingResponse(
  response: AdminProvisionedOnboardingResponse,
) {
  applyAdminProvisionedOnboardingToWizard(response)
  syncAdminProvisionedOnboardingToMeCache(response)
}
