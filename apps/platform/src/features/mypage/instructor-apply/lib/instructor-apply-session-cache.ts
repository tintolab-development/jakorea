import { INSTRUCTOR_APPLY_PATH } from '../../lib/constants'
import { INSTRUCTOR_APPLY_CONSENT_KEYS } from '../consent/catalog'

const FORM_STORAGE_KEY = 'platform.instructor-apply.form'
const LEGACY_CONSENT_DRAFT_PREFIX = 'platform.instructor-apply.consent-draft.'
const SCHEMA_CONSENT_DRAFT_PREFIX = 'platform.instructor-apply.consent-schema-draft.v2.'
export const INSTRUCTOR_APPLY_SESSION_PREFIX = 'platform.instructor-apply.'

export function isInstructorApplyFlowPath(pathname: string): boolean {
  return (
    pathname === INSTRUCTOR_APPLY_PATH || pathname.startsWith(`${INSTRUCTOR_APPLY_PATH}/`)
  )
}

/** 강사 신청 양식·동의서 작성 sessionStorage (로그아웃 후 동일 탭에도 남을 수 있음) */
export function clearInstructorApplySessionCache(): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return
  try {
    window.sessionStorage.removeItem(FORM_STORAGE_KEY)
    for (const key of INSTRUCTOR_APPLY_CONSENT_KEYS) {
      window.sessionStorage.removeItem(`${LEGACY_CONSENT_DRAFT_PREFIX}${key}`)
      window.sessionStorage.removeItem(`${SCHEMA_CONSENT_DRAFT_PREFIX}${key}`)
    }

    const keysToRemove: string[] = []
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const storageKey = window.sessionStorage.key(index)
      if (storageKey?.startsWith(INSTRUCTOR_APPLY_SESSION_PREFIX)) {
        keysToRemove.push(storageKey)
      }
    }
    for (const storageKey of keysToRemove) {
      window.sessionStorage.removeItem(storageKey)
    }
  } catch {
    /* private mode / quota */
  }
}
