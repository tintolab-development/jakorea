import { isBirthDateInputIncomplete } from '@/shared/ui/date-text-input'
import type { InstructorProfileFormValues } from '@/features/user/shared/ui/instructor-profile-form/instructor-profile-form-model'

/** 강사 신규 등록 — 동의서 작성 전 기본 정보(기본 정보 섹션) 필수값 누락 여부 */
export function isInstructorRegisterBasicInfoIncompleteForConsent(
  values: InstructorProfileFormValues | undefined
): boolean {
  if (values == null) return true

  if (!values.name?.trim()) return true

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateInputIncomplete(birthDate)) return true

  if (!values.contact?.trim()) return true
  if (!values.email?.trim()) return true

  if (!values.homeAddress?.trim()) return true

  if (!values.bankName?.trim()) return true
  if (!values.accountNumber?.trim()) return true
  if (!values.accountHolder?.trim()) return true

  if (values.memberType === 'school_teacher') {
    if (!values.schoolName?.trim()) return true
  } else if (!values.affiliationNone && !values.affiliationName?.trim()) {
    return true
  }

  return false
}
