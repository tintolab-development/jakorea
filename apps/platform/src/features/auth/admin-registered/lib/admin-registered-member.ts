import { isValidEmail } from '@/features/auth/sign-up'
import type { GenderType } from '@/features/auth/sign-up'
import { MOCK_ADMIN_REGISTERED_BIRTH_DATE, MOCK_ADMIN_REGISTERED_EMAIL } from './constants'
import {
  clearAdminRegisteredWizardState,
  getAdminRegisteredWizardState,
  initAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from './wizard-state'

export function isMockAdminRegisteredEmail(email: string) {
  return email.trim().toLowerCase() === MOCK_ADMIN_REGISTERED_EMAIL.toLowerCase()
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
  const normalizedEmail = email.trim()
  const normalizedPassword = password.trim()

  if (!isValidEmail(normalizedEmail)) {
    return false
  }

  return normalizedEmail.toLowerCase() === normalizedPassword.toLowerCase()
}

export function canSkipAdminRegisteredBirthStep() {
  const state = getAdminRegisteredWizardState()
  return Boolean(state?.birthDate && state.gender)
}

export function setAdminRegisteredPasswordChangeRequired(
  email: string,
  entrySource: 'first-login' | 'sign-up' = 'first-login',
) {
  initAdminRegisteredWizardState(email, entrySource)
}

export function getAdminRegisteredPasswordChangeRequired() {
  const wizardState = getAdminRegisteredWizardState()
  return wizardState ? { email: wizardState.email } : null
}

export function clearAdminRegisteredPasswordChangeRequired() {
  clearAdminRegisteredWizardState()
}

export function requiresAdminRegisteredPasswordChange(email: string) {
  const pending = getAdminRegisteredWizardState()

  if (!pending) {
    return false
  }

  return pending.email.toLowerCase() === email.trim().toLowerCase()
}
