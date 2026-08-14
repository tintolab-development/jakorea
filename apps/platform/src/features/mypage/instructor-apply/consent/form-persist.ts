import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import {
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import type { InstructorApplyConsentKey } from './catalog'

const FORM_STORAGE_KEY = 'platform.instructor-apply.form'

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadInstructorApplyFormDraft(): InstructorSharedProfileFormValues | null {
  if (!canUseSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(FORM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as InstructorSharedProfileFormValues
    if (parsed == null || typeof parsed !== 'object') return null
    return { ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES, ...parsed }
  } catch {
    return null
  }
}

export function saveInstructorApplyFormDraft(values: InstructorSharedProfileFormValues): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(values))
  } catch {
    /* quota / private mode */
  }
}

export function markInstructorApplyConsentAgreed(key: InstructorApplyConsentKey): void {
  const current = loadInstructorApplyFormDraft() ?? INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES
  saveInstructorApplyFormDraft({ ...current, [key]: CONSENT_VALUE.agree })
}
