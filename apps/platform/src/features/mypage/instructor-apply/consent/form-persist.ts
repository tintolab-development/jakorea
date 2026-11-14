import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import {
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import type { InstructorApplyConsentKey } from './catalog'

const FORM_STORAGE_KEY = 'platform.instructor-apply.form'

/**
 * 강사 신청 폼 초기값 — 사용자가 직접 고르는 라디오(사업소득자 여부·경력 구분)는 선택 전 상태로 시작한다.
 * 공유 타입은 선택값만 허용하므로 Platform 신청 초기값에서만 빈 값을 넣는다.
 * 미선택 제출은 `collectInstructorRegisterValidation`(사업소득자 여부·경력 구분 필수)이 막는다.
 * 회원정보에서 고정으로 채우는 값(성별 등)은 `applyLockedBasicToInstructorForm`이 덮어쓴다.
 */
export const INSTRUCTOR_APPLY_INITIAL_FORM_VALUES: InstructorSharedProfileFormValues = {
  ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  isBusinessIncome: '' as unknown as InstructorSharedProfileFormValues['isBusinessIncome'],
  careerLevel: '' as unknown as InstructorSharedProfileFormValues['careerLevel'],
}

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
    return { ...INSTRUCTOR_APPLY_INITIAL_FORM_VALUES, ...parsed }
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
  const current = loadInstructorApplyFormDraft() ?? INSTRUCTOR_APPLY_INITIAL_FORM_VALUES
  saveInstructorApplyFormDraft({ ...current, [key]: CONSENT_VALUE.agree })
}
