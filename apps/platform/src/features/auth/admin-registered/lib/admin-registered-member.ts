import type { GenderType } from '@/features/auth/sign-up'
import { normalizeEmailId } from '@/shared/lib/email-id'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'
import { MOCK_ADMIN_REGISTERED_BIRTH_DATE, MOCK_ADMIN_REGISTERED_EMAIL } from './constants'
import {
  clearAdminRegisteredWizardState,
  getAdminRegisteredWizardState,
  initAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '../model/wizard-state'
import {
  shouldContinueAdminProvisionedOnboarding,
  type AdminProvisionedOnboardingFlags,
} from './onboarding-step'
import { syncAdminRegisteredOnboardingSession } from './sync-onboarding-session'

export function isMockAdminRegisteredEmail(email: string) {
  return normalizeEmailId(email) === normalizeEmailId(MOCK_ADMIN_REGISTERED_EMAIL)
}

/** API 연동 전: 본인인증 결과와 DB 대조 시 관리자 등록 회원 mock */
export function isMockAdminRegisteredIdentityMatch(birthDate: string) {
  return birthDate.trim() === MOCK_ADMIN_REGISTERED_BIRTH_DATE
}

export function startAdminRegisteredFlowFromSignUp(input: {
  birthDate: string
  gender: GenderType
}) {
  initAdminRegisteredWizardState(MOCK_ADMIN_REGISTERED_EMAIL, 'sign-up')
  updateAdminRegisteredWizardState({
    birthDate: input.birthDate,
    gender: input.gender,
  })
}

export function getAdminRegisteredSignUpChangePasswordPath() {
  return canSkipAdminRegisteredBirthStep()
    ? '/auth/admin-registered/change-password'
    : '/auth/admin-registered/birth'
}

export function canSkipAdminRegisteredBirthStep() {
  const state = getAdminRegisteredWizardState()
  return Boolean(state?.birthDate && state.gender)
}

/**
 * 관리자 등록 온보딩 위저드로 보낼지.
 * `adminProvisionedOnboardingRequired === true` 이고 step 이 PROFILE | IDENTITY | PASSWORD | PROFILE_REVIEW 일 때만 true.
 */
export function requiresAdminRegisteredOnboarding(flags: AdminProvisionedOnboardingFlags) {
  return shouldContinueAdminProvisionedOnboarding(flags)
}

export function setAdminRegisteredPasswordChangeRequired(
  email: string,
  entrySourceOrFlags: 'first-login' | 'sign-up' | AdminProvisionedOnboardingFlags = 'first-login',
  maybeEntrySource: 'first-login' | 'sign-up' = 'first-login',
) {
  const entrySource =
    typeof entrySourceOrFlags === 'string' ? entrySourceOrFlags : maybeEntrySource
  const isLegacyMockEntry = typeof entrySourceOrFlags === 'string'
  const flags: AdminProvisionedOnboardingFlags = isLegacyMockEntry
    ? { registeredByAdmin: true }
    : entrySourceOrFlags

  syncAdminRegisteredOnboardingSession(email, flags, entrySource)
  // 가입 mock 은 로그인 플래그 없이 안내 화면만 연다. API step 이 없으므로 위저드 판정은 false 다.
  if (isLegacyMockEntry) {
    setAdminOnboardingRequired(true)
  }
}

export function getAdminRegisteredPasswordChangeRequired() {
  const wizardState = getAdminRegisteredWizardState()
  return wizardState ? { email: wizardState.email } : null
}

export function clearAdminRegisteredPasswordChangeRequired() {
  clearAdminRegisteredWizardState()
  setAdminOnboardingRequired(false)
}

export function requiresAdminRegisteredPasswordChange(email: string) {
  const pending = getAdminRegisteredWizardState()

  if (!pending) {
    return false
  }

  return pending.email === normalizeEmailId(email)
}
