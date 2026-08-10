import type { ConsentValue } from './consent.js'
import type { InstructorMemberType } from './member-type.js'
import type { InstructorSharedProfileFormValues } from './profile-form-values.js'

const DEFAULT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 010-1234-5678 형태 (하이픈 포함) */
const DEFAULT_KOREAN_PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/

/** 제출 시 기본 정보 전 항목 + 필수 동의 2개 */
export type InstructorRegisterValidationInput = Pick<
  InstructorSharedProfileFormValues,
  | 'name'
  | 'gender'
  | 'birthDate'
  | 'contact'
  | 'email'
  | 'memberType'
  | 'schoolName'
  | 'employmentStatus'
  | 'affiliationName'
  | 'affiliationNone'
  | 'homeAddress'
  | 'homeAddressDetail'
  | 'instructorCareer'
  | 'bankName'
  | 'accountNumber'
  | 'accountHolder'
  | 'isBusinessIncome'
  | 'oneLineIntro'
  | 'consentTermsOfService'
  | 'consentPersonal'
>

export type InstructorRegisterFormatChecks = {
  /** true면 생년월일 미완성 → 필수 누락으로 처리 */
  isBirthDateIncomplete?: (value: string) => boolean
  /** false면 형식 오류 메시지 */
  isBirthDateValid?: (value: string) => boolean
  isPhoneValid?: (value: string) => boolean
  isEmailValid?: (value: string) => boolean
}

export type InstructorRegisterValidationResult = {
  missingRequired: boolean
  formatMessages: string[]
}

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim()
}

export function collectInstructorRegisterValidation(
  values: InstructorRegisterValidationInput,
  formatChecks: InstructorRegisterFormatChecks = {},
): InstructorRegisterValidationResult {
  let missingRequired = false
  const formatMessages: string[] = []

  const isBirthDateIncomplete = formatChecks.isBirthDateIncomplete ?? (() => false)
  const isBirthDateValid = formatChecks.isBirthDateValid ?? (() => true)
  const isPhoneValid =
    formatChecks.isPhoneValid ?? ((value: string) => DEFAULT_KOREAN_PHONE_PATTERN.test(value))
  const isEmailValid =
    formatChecks.isEmailValid ?? ((value: string) => DEFAULT_EMAIL_PATTERN.test(value))

  if (isBlank(values.name)) missingRequired = true
  if (!values.gender) missingRequired = true

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateIncomplete(birthDate)) {
    missingRequired = true
  } else if (!isBirthDateValid(birthDate)) {
    formatMessages.push('올바른 생년월일을 입력해 주세요.')
  }

  const contact = values.contact?.trim()
  if (!contact) {
    missingRequired = true
  } else if (!isPhoneValid(contact)) {
    formatMessages.push('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
  }

  const email = values.email?.trim()
  if (!email) {
    missingRequired = true
  } else if (!isEmailValid(email)) {
    formatMessages.push('올바른 이메일 형식이 아닙니다')
  }

  if (!values.memberType) missingRequired = true

  if (values.memberType === ('school_teacher' satisfies InstructorMemberType)) {
    if (isBlank(values.schoolName)) missingRequired = true
    if (!values.employmentStatus) missingRequired = true
  } else if (!values.affiliationNone && isBlank(values.affiliationName)) {
    missingRequired = true
  }

  if (isBlank(values.homeAddress)) missingRequired = true
  if (isBlank(values.homeAddressDetail)) missingRequired = true
  if (isBlank(values.instructorCareer)) missingRequired = true
  if (isBlank(values.bankName)) missingRequired = true
  if (isBlank(values.accountNumber)) missingRequired = true
  if (isBlank(values.accountHolder)) missingRequired = true
  if (!values.isBusinessIncome) missingRequired = true
  if (isBlank(values.oneLineIntro)) missingRequired = true

  if (values.consentTermsOfService !== ('agree' satisfies ConsentValue)) {
    missingRequired = true
  }
  if (values.consentPersonal !== ('agree' satisfies ConsentValue)) {
    missingRequired = true
  }

  return { missingRequired, formatMessages }
}

export type InstructorConsentBasicInfoInput = Pick<
  InstructorSharedProfileFormValues,
  | 'name'
  | 'birthDate'
  | 'contact'
  | 'email'
  | 'homeAddress'
  | 'bankName'
  | 'accountNumber'
  | 'accountHolder'
  | 'memberType'
  | 'schoolName'
  | 'affiliationNone'
  | 'affiliationName'
>

/**
 * 동의서 작성 전 기본 정보 필수값 누락 여부.
 * `isBirthDateIncomplete`를 앱에서 주입 (CMS date-text-input 등).
 */
export function isInstructorRegisterBasicInfoIncompleteForConsent(
  values: InstructorConsentBasicInfoInput | undefined,
  isBirthDateIncomplete: (value: string) => boolean = () => false,
): boolean {
  if (values == null) return true

  if (!values.name?.trim()) return true

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateIncomplete(birthDate)) return true

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
