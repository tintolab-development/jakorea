import type { PlatformMemberProfile } from '../../model/types.ts'
import type { BasicConsentAudience, SettingsConsentItem } from './consent-catalog.ts'

/** 교사(비겸직) · 교사 겸직 강사 — 교사 전용 약관 노출 */
export function isTeacherSettingsProfile(profile: PlatformMemberProfile): boolean {
  return profile === 'school_teacher' || profile === 'instructor_dual'
}

export function isUnder14FromBirthDate(birthDate: string | undefined, now = new Date()): boolean {
  const matched = birthDate?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return false

  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  const fourteenthBirthday = new Date(year + 14, month - 1, day)
  return now < fourteenthBirthday
}

/** profile `under14` → `ageGroup`(profile, auth/me) → 생년월일(구 배포 fallback) */
export function isMinorSettingsMember(input: {
  under14?: boolean
  ageGroup?: string
  birthDate?: string
}): boolean {
  if (input.under14 === true) return true
  const ageGroup = input.ageGroup?.trim().toUpperCase()
  if (ageGroup === 'UNDER_14') return true
  if (ageGroup === 'OVER_14') return false
  return isUnder14FromBirthDate(input.birthDate)
}

/** 교사·미성년 전용 기본 동의 — `getBasicConsentItems`와 동일 노출 규칙 */
export function filterBasicConsentItemsByAudience(
  items: SettingsConsentItem[],
  audience: BasicConsentAudience,
): SettingsConsentItem[] {
  return items.filter(item => {
    if (item.id === 'teacherInfo') return audience.isTeacher
    if (item.id === 'guardianLegal' || item.id === 'childPrivacy') return audience.isMinor
    return true
  })
}
