import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import { isBirthDateInputIncomplete } from '@/shared/ui/date-text-input'

export type MemberRegisterConsentBasicInfoInput = {
  name?: string
  birthDate?: string
  schoolEnrollmentStatus?: 'enrolled' | 'not_enrolled'
  schoolName?: string
  grade?: string
  contact?: string
  email?: string
  address?: string
  detailAddress?: string
}

/** 회원 신규 등록 — 동의서 작성 전 기본 정보(기본 정보 섹션) 필수값 누락 여부 */
export function isMemberRegisterBasicInfoIncompleteForConsent(
  values: MemberRegisterConsentBasicInfoInput | undefined,
  isBirthDateIncomplete: (value: string) => boolean = isBirthDateInputIncomplete,
): boolean {
  if (values == null) return true

  if (!values.name?.trim()) return true

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateIncomplete(birthDate)) return true

  if (values.schoolEnrollmentStatus === 'enrolled') {
    if (!values.schoolName?.trim()) return true
    if (!values.grade?.trim()) return true
  }

  if (!values.contact?.trim()) return true
  if (!values.email?.trim()) return true
  if (
    isRequiredAddressIncomplete({
      address: values.address,
      addressDetail: values.detailAddress,
      subject: 'person',
    })
  ) {
    return true
  }

  return false
}
