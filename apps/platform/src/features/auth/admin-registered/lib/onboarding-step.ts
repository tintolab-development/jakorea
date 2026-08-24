import { ADMIN_REGISTERED_NOTICE_PATH } from './constants'

/** OpenAPI `AuthTokenResponse.adminProvisionedOnboardingStep` */
export type AdminProvisionedOnboardingStep =
  | 'PROFILE'
  | 'IDENTITY'
  | 'PASSWORD'
  | 'PROFILE_REVIEW'
  | 'DONE'

export const ADMIN_PROVISIONED_ONBOARDING_STEPS: AdminProvisionedOnboardingStep[] = [
  'PROFILE',
  'IDENTITY',
  'PASSWORD',
  'PROFILE_REVIEW',
  'DONE',
]

export type AdminProvisionedOnboardingFlags = {
  registeredByAdmin?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string | null
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}

const STEP_PATH: Record<
  Exclude<AdminProvisionedOnboardingStep, 'DONE'>,
  string
> = {
  PROFILE: '/auth/admin-registered/birth',
  IDENTITY: '/auth/admin-registered/identity',
  PASSWORD: '/auth/admin-registered/change-password',
  PROFILE_REVIEW: '/auth/admin-registered/confirm',
}

export function normalizeAdminProvisionedOnboardingStep(
  value: string | null | undefined,
): AdminProvisionedOnboardingStep | null {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (!normalized) return null
  return ADMIN_PROVISIONED_ONBOARDING_STEPS.includes(
    normalized as AdminProvisionedOnboardingStep,
  )
    ? (normalized as AdminProvisionedOnboardingStep)
    : null
}

export function getAdminProvisionedOnboardingStepIndex(
  step: AdminProvisionedOnboardingStep,
): number {
  return ADMIN_PROVISIONED_ONBOARDING_STEPS.indexOf(step)
}

export function resolveAdminProvisionedStepFromPathname(
  pathname: string,
): AdminProvisionedOnboardingStep | null {
  if (pathname.startsWith('/auth/admin-registered/edit')) return 'PROFILE_REVIEW'
  if (pathname.startsWith('/auth/admin-registered/confirm')) return 'PROFILE_REVIEW'
  if (pathname.startsWith('/auth/admin-registered/change-password')) return 'PASSWORD'
  if (pathname.startsWith('/auth/admin-registered/identity')) return 'IDENTITY'
  if (pathname.startsWith('/auth/admin-registered/birth')) return 'PROFILE'
  if (pathname.startsWith('/auth/admin-registered/complete')) return 'DONE'
  return null
}

export function resolveAdminProvisionedOnboardingPath(
  step: AdminProvisionedOnboardingStep | null | undefined,
): string | null {
  if (!step || step === 'DONE') return null
  return STEP_PATH[step]
}

export function shouldContinueAdminProvisionedOnboarding(
  flags: AdminProvisionedOnboardingFlags,
): boolean {
  if (flags.registeredByAdmin !== true) return false
  if (flags.identitySelfSignupCompletedAfterAdminRegistration === true) return false

  const step = resolveEffectiveAdminProvisionedOnboardingStep(flags)
  return step != null && step !== 'DONE'
}

export function resolveEffectiveAdminProvisionedOnboardingStep(
  flags: AdminProvisionedOnboardingFlags,
): AdminProvisionedOnboardingStep | null {
  if (flags.identitySelfSignupCompletedAfterAdminRegistration === true) {
    return 'DONE'
  }

  const fromApi = normalizeAdminProvisionedOnboardingStep(
    flags.adminProvisionedOnboardingStep,
  )
  if (fromApi) return fromApi

  if (
    flags.registeredByAdmin === true &&
    (flags.adminProvisionedOnboardingRequired === true ||
      flags.identitySelfSignupCompletedAfterAdminRegistration === false)
  ) {
    return 'PROFILE'
  }

  return null
}

/** 로그인·마이페이지 진입 시 온보딩 첫 화면 (notice 생략, step 직행) */
export function resolveAdminProvisionedOnboardingEntryPath(
  flags: AdminProvisionedOnboardingFlags,
): string | null {
  if (!shouldContinueAdminProvisionedOnboarding(flags)) {
    return null
  }

  const step = resolveEffectiveAdminProvisionedOnboardingStep(flags)
  return resolveAdminProvisionedOnboardingPath(step) ?? ADMIN_REGISTERED_NOTICE_PATH
}

export function shouldRedirectAdminProvisionedOnboardingStep(input: {
  pathname: string
  flags: AdminProvisionedOnboardingFlags
}): string | null {
  const pageStep = resolveAdminProvisionedStepFromPathname(input.pathname)
  if (!pageStep) return null

  if (!shouldContinueAdminProvisionedOnboarding(input.flags)) {
    return pageStep === 'DONE' ? null : '/'
  }

  const serverStep = resolveEffectiveAdminProvisionedOnboardingStep(input.flags)
  if (!serverStep) return null

  if (pageStep === 'DONE') {
    return null
  }

  if (serverStep === 'DONE') {
    return '/auth/admin-registered/complete'
  }

  const serverIndex = getAdminProvisionedOnboardingStepIndex(serverStep)
  const pageIndex = getAdminProvisionedOnboardingStepIndex(pageStep)

  if (serverIndex === pageIndex) return null

  return resolveAdminProvisionedOnboardingPath(serverStep)
}
