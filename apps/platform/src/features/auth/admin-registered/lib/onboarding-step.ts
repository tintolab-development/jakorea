import { ADMIN_REGISTERED_NOTICE_PATH } from './constants.ts'

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
  /** 대상이 아니면 `null`. 빈 문자열·`DONE`으로 바꾸지 않는다. */
  adminProvisionedOnboardingStep?: string | null
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
  passwordChangeRequired?: boolean
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

function isOpenAdminProvisionedOnboardingStep(
  step: AdminProvisionedOnboardingStep | null,
): step is Exclude<AdminProvisionedOnboardingStep, 'DONE'> {
  return (
    step === 'PROFILE' ||
    step === 'IDENTITY' ||
    step === 'PASSWORD' ||
    step === 'PROFILE_REVIEW'
  )
}

/**
 * 온보딩 위저드는 서버가 대상이라고 한 경우에만 연다.
 * `registeredByAdmin` · `identitySelfSignupCompletedAfterAdminRegistration === false` 만으로는 열지 않는다.
 * PASSWORD 는 `passwordChangeRequired === true` 일 때만 임시 비밀번호 변경 화면으로 간다.
 */
export function shouldContinueAdminProvisionedOnboarding(
  flags: AdminProvisionedOnboardingFlags,
): boolean {
  if (flags.adminProvisionedOnboardingRequired !== true) return false

  const step = normalizeAdminProvisionedOnboardingStep(flags.adminProvisionedOnboardingStep)
  if (!isOpenAdminProvisionedOnboardingStep(step)) return false
  if (step === 'PASSWORD' && flags.passwordChangeRequired !== true) return false
  return true
}

export function resolveEffectiveAdminProvisionedOnboardingStep(
  flags: AdminProvisionedOnboardingFlags,
): AdminProvisionedOnboardingStep | null {
  if (!shouldContinueAdminProvisionedOnboarding(flags)) return null
  return normalizeAdminProvisionedOnboardingStep(flags.adminProvisionedOnboardingStep)
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

export type AdminProvisionedNoticeCta = {
  path: string
  buttonLabel: string
  description: string
}

/** notice CTA — 본인인증이 끝난 단계에서는 비밀번호·정보 확인만 안내한다. */
export function resolveAdminProvisionedNoticeCta(
  flags: AdminProvisionedOnboardingFlags,
): AdminProvisionedNoticeCta | null {
  const path = resolveAdminProvisionedOnboardingEntryPath(flags)
  if (!path) return null

  const step = resolveEffectiveAdminProvisionedOnboardingStep(flags)
  if (step === 'PASSWORD') {
    return {
      path,
      buttonLabel: '비밀번호 변경하기',
      description: '안전한 이용을 위해 비밀번호를 변경해 주세요.',
    }
  }
  if (step === 'PROFILE_REVIEW') {
    return {
      path,
      buttonLabel: '가입 정보 확인하기',
      description: '가입된 정보를 확인해 주세요.',
    }
  }

  return {
    path,
    buttonLabel: '본인인증 후 비밀번호 변경하기',
    description: '안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.',
  }
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
