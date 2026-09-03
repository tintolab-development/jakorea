/**
 * 최초 로그인 passwordChangeRequired 위저드 상태 (sessionStorage)
 */

import type { AdminRegisterGender } from '@/types/admin-register'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

const WIZARD_STORAGE_KEY = 'cms:password-change-required-wizard'

export type PasswordChangeRequiredWizardState = {
  email: string
  birthDate?: string
  gender?: AdminRegisterGender
  identityVerificationSessionId?: number
  verifiedName?: string
  verifiedPhone?: string
}

function readWizardState(): PasswordChangeRequiredWizardState | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }

  const raw = window.sessionStorage.getItem(WIZARD_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PasswordChangeRequiredWizardState
    if (!parsed.email?.trim()) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeWizardState(state: PasswordChangeRequiredWizardState) {
  window.sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state))
}

export function getPasswordChangeRequiredWizardState() {
  return readWizardState()
}

export function initPasswordChangeRequiredWizardState(email: string) {
  const state: PasswordChangeRequiredWizardState = {
    email: email.trim(),
  }
  writeWizardState(state)
  return state
}

export function updatePasswordChangeRequiredWizardState(
  partial: Partial<PasswordChangeRequiredWizardState>
) {
  const current = readWizardState()
  if (!current) {
    return null
  }
  const next = { ...current, ...partial }
  writeWizardState(next)
  return next
}

export function clearPasswordChangeRequiredWizardState() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }
  window.sessionStorage.removeItem(WIZARD_STORAGE_KEY)
}

const COMPLETE_STORAGE_KEY = 'cms:password-change-required-complete'

export function markPasswordChangeRequiredComplete() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }
  window.sessionStorage.setItem(COMPLETE_STORAGE_KEY, '1')
}

export function hasPasswordChangeRequiredComplete(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }
  return window.sessionStorage.getItem(COMPLETE_STORAGE_KEY) === '1'
}

export function clearPasswordChangeRequiredComplete() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }
  window.sessionStorage.removeItem(COMPLETE_STORAGE_KEY)
}

export function requirePasswordChangeRequiredWizardState() {
  const state = readWizardState()
  if (!state?.email) {
    window.location.assign(passwordChangeRequiredPaths.notice)
    return null
  }
  return state
}

export function hasBirthGender(state: PasswordChangeRequiredWizardState | null): boolean {
  return Boolean(state?.birthDate && state.gender)
}

export function hasIdentityVerified(state: PasswordChangeRequiredWizardState | null): boolean {
  return Boolean(state?.identityVerificationSessionId)
}
