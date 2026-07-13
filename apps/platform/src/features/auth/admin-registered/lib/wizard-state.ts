import type { GenderType, SchoolStatus } from '@/features/auth/sign-up'
import { MOCK_ADMIN_REGISTERED_PROFILE } from './constants'

const ADMIN_REGISTERED_WIZARD_STORAGE_KEY = 'platform:dev:admin-registered-wizard'

export type AdminRegisteredEntrySource = 'first-login' | 'sign-up'

export type AdminRegisteredWizardState = {
  email: string
  entrySource?: AdminRegisteredEntrySource
  birthDate?: string
  gender?: GenderType
  schoolStatus?: SchoolStatus
  schoolName?: string
  grade?: string
  address?: string
  addressDetail?: string
  volunteerId?: string
}

function readWizardState(): AdminRegisteredWizardState | null {
  const raw = window.localStorage.getItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AdminRegisteredWizardState

    if (!parsed.email?.trim()) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeWizardState(state: AdminRegisteredWizardState) {
  window.localStorage.setItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY, JSON.stringify(state))
}

export function getAdminRegisteredWizardState() {
  return readWizardState()
}

export function setAdminRegisteredWizardState(state: AdminRegisteredWizardState) {
  writeWizardState(state)
}

export function updateAdminRegisteredWizardState(partial: Partial<AdminRegisteredWizardState>) {
  const current = readWizardState()

  if (!current) {
    return null
  }

  const next = { ...current, ...partial }
  writeWizardState(next)
  return next
}

export function initAdminRegisteredWizardState(
  email: string,
  entrySource: AdminRegisteredEntrySource = 'first-login',
) {
  const state: AdminRegisteredWizardState = {
    email: email.trim(),
    entrySource,
    ...MOCK_ADMIN_REGISTERED_PROFILE,
  }

  writeWizardState(state)
  return state
}

export function isAdminRegisteredSignUpEntry() {
  return getAdminRegisteredWizardState()?.entrySource === 'sign-up'
}

export function clearAdminRegisteredWizardState() {
  window.localStorage.removeItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY)
}

export function requireAdminRegisteredWizardState() {
  const state = readWizardState()

  if (!state?.email) {
    window.location.assign('/auth/admin-registered/notice')
    return null
  }

  return state
}

export function getAdminRegisteredProfileFields(state: AdminRegisteredWizardState) {
  return {
    schoolStatus: state.schoolStatus ?? MOCK_ADMIN_REGISTERED_PROFILE.schoolStatus,
    schoolName: state.schoolName ?? MOCK_ADMIN_REGISTERED_PROFILE.schoolName,
    grade: state.grade ?? MOCK_ADMIN_REGISTERED_PROFILE.grade,
    address: state.address ?? MOCK_ADMIN_REGISTERED_PROFILE.address,
    addressDetail: state.addressDetail ?? MOCK_ADMIN_REGISTERED_PROFILE.addressDetail,
    volunteerId: state.volunteerId ?? MOCK_ADMIN_REGISTERED_PROFILE.volunteerId,
  }
}
