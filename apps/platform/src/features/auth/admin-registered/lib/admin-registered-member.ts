import type { GenderType } from '@/features/auth/sign-up'
import { isValidEmailId, normalizeEmailId } from '@/shared/lib/email-id'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'
import { MOCK_ADMIN_REGISTERED_BIRTH_DATE, MOCK_ADMIN_REGISTERED_EMAIL } from './constants'
import {
  clearAdminRegisteredWizardState,
  getAdminRegisteredWizardState,
  initAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '../model/wizard-state'

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

/** API 연동 전: 이메일·비밀번호가 동일하면 관리자 등록 회원 최초 로그인으로 취급 */
export function isMockAdminRegisteredFirstLogin(email: string, password: string) {
  const normalizedEmail = normalizeEmailId(email)
  const normalizedPassword = password.trim().toLowerCase()

  if (!isValidEmailId(normalizedEmail)) {
    return false
  }

  return normalizedEmail === normalizedPassword
}

export function canSkipAdminRegisteredBirthStep() {
  const state = getAdminRegisteredWizardState()
  return Boolean(state?.birthDate && state.gender)
}

/**
 * 관리자가 등록한 계정 안내 화면으로 보낼지.
 * `registeredByAdmin === true` 이고 본인 가입 온보딩이 아직 끝나지 않았을 때만 true.
 */
export function requiresAdminRegisteredOnboarding(flags: {
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}) {
  return (
    flags.registeredByAdmin === true &&
    flags.identitySelfSignupCompletedAfterAdminRegistration === false
  )
}

export function setAdminRegisteredPasswordChangeRequired(
  email: string,
  entrySource: 'first-login' | 'sign-up' = 'first-login',
) {
  initAdminRegisteredWizardState(normalizeEmailId(email), entrySource)
  if (entrySource === 'first-login') {
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
