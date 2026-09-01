import { isInstructorRegisterBasicInfoIncompleteForConsent as domainIsIncomplete } from '@jakorea/domain/instructor/validate-register'
import { isBirthDateInputIncomplete } from '@/shared/ui/date-text-input'
import type { InstructorProfileFormValues } from '@/features/user/shared/ui/instructor-profile-form/instructor-profile-form-model'

/** 강사 신규 등록 — 동의서 작성 전 기본 정보(기본 정보 섹션) 필수값 누락 여부 */
export function isInstructorRegisterBasicInfoIncompleteForConsent(
  values: InstructorProfileFormValues | undefined,
): boolean {
  return domainIsIncomplete(values, isBirthDateInputIncomplete)
}
