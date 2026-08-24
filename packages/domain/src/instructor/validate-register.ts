import { isValidKoreanPhoneNumber } from '../shared/korean-phone.js'
import { isRequiredAddressIncomplete } from '../shared/required-address.js'
import { CAREER_LEVEL } from './career-level.js'
import type { ConsentValue } from './consent.js'
import { EDUCATION_STATUS } from './education-options.js'
import type { EducationDetailKey } from './education-options.js'
import type { InstructorMemberType } from './member-type.js'
import type {
  InstructorCareerRow,
  InstructorEducationGraduateRow,
  InstructorEducationSchoolRow,
  InstructorSharedProfileFormValues,
} from './profile-form-values.js'

const DEFAULT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 제출 시 기본 정보 전 항목 + 동의(키는 options로 확장 가능) */
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
  | 'consentMarketing'
  | 'consentPortrait'
  | 'consentPaymentStatement'
  | 'consentEducatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'
  | 'eduSchoolType'
  | 'eduStatus'
  | 'educationDetailKeys'
  | 'highSchool'
  | 'college23Rows'
  | 'college4Rows'
  | 'graduateRows'
  | 'careerLevel'
  | 'careers'
  | 'freeWrite1'
  | 'freeWrite2'
  | 'freeWrite3'
  | 'freeWrite4'
>

export type InstructorRegisterFormatChecks = {
  /** true면 생년월일 미완성 → 필수 누락으로 처리 */
  isBirthDateIncomplete?: (value: string) => boolean
  /** false면 형식 오류 메시지 */
  isBirthDateValid?: (value: string) => boolean
  isPhoneValid?: (value: string) => boolean
  isEmailValid?: (value: string) => boolean
}

export type InstructorRegisterValidationOptions = {
  /**
   * 동의(agree) 필수 키. 기본: 서비스 이용약관·개인정보(강사 신규 등록과 동일).
   */
  requiredConsentAgreeKeys?: readonly (keyof InstructorRegisterValidationInput)[]
  /**
   * Platform 강사 신청: 최종 학력(학교·상태) + 체크된 학력 상세 행 필수.
   * CMS 등록 검증은 기본 false 유지.
   */
  requireEducation?: boolean
  /**
   * Platform 강사 신청: 경력 구분 필수 + 경력일 때 경력 행 입력값 필수.
   * CMS 등록 검증은 기본 false 유지.
   */
  requireCareer?: boolean
  /**
   * Platform 강사 신청: 자유 작성 1~4 필수.
   * CMS 등록 검증은 기본 false 유지.
   */
  requireFreeWrite?: boolean
}

export type InstructorRegisterValidationResult = {
  missingRequired: boolean
  formatMessages: string[]
}

const DEFAULT_REQUIRED_CONSENT_KEYS = [
  'consentTermsOfService',
  'consentPersonal',
] as const satisfies ReadonlyArray<keyof InstructorRegisterValidationInput>

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim()
}

function isEducationSchoolRowIncomplete(
  row: InstructorEducationSchoolRow,
  options: { requireMajor: boolean; requireGradYear: boolean },
): boolean {
  if (isBlank(row.admitYear)) return true
  if (options.requireGradYear && isBlank(row.gradYear)) return true
  if (isBlank(row.schoolName)) return true
  if (options.requireMajor && isBlank(row.major)) return true
  return false
}

function isEducationGraduateRowIncomplete(
  row: InstructorEducationGraduateRow,
  requireGradYear: boolean,
): boolean {
  return (
    isEducationSchoolRowIncomplete(row, { requireMajor: true, requireGradYear }) ||
    isBlank(row.degree)
  )
}

function isEducationSectionIncomplete(
  values: Pick<
    InstructorRegisterValidationInput,
    | 'eduSchoolType'
    | 'eduStatus'
    | 'educationDetailKeys'
    | 'highSchool'
    | 'college23Rows'
    | 'college4Rows'
    | 'graduateRows'
  >,
): boolean {
  if (isBlank(values.eduSchoolType) || isBlank(values.eduStatus)) return true

  const enrolledFinal =
    values.eduStatus === EDUCATION_STATUS.enrolled && Boolean(values.eduSchoolType)
  const requireGradYearFor = (key: EducationDetailKey) =>
    !(enrolledFinal && values.eduSchoolType === key)

  for (const key of values.educationDetailKeys) {
    switch (key) {
      case 'high':
        if (
          isEducationSchoolRowIncomplete(values.highSchool, {
            requireMajor: false,
            requireGradYear: requireGradYearFor('high'),
          })
        ) {
          return true
        }
        break
      case 'college23':
        if (values.college23Rows.length === 0) return true
        if (
          values.college23Rows.some(row =>
            isEducationSchoolRowIncomplete(row, {
              requireMajor: true,
              requireGradYear: requireGradYearFor('college23'),
            }),
          )
        ) {
          return true
        }
        break
      case 'college4':
        if (values.college4Rows.length === 0) return true
        if (
          values.college4Rows.some(row =>
            isEducationSchoolRowIncomplete(row, {
              requireMajor: true,
              requireGradYear: requireGradYearFor('college4'),
            }),
          )
        ) {
          return true
        }
        break
      case 'graduate':
        if (values.graduateRows.length === 0) return true
        if (
          values.graduateRows.some(row =>
            isEducationGraduateRowIncomplete(row, requireGradYearFor('graduate')),
          )
        ) {
          return true
        }
        break
      default:
        break
    }
  }

  return false
}

function isCareerRowIncomplete(row: InstructorCareerRow): boolean {
  if (isBlank(row.periodStart)) return true
  if (!row.currentlyEmployed && isBlank(row.periodEnd)) return true
  if (isBlank(row.companyName)) return true
  if (isBlank(row.roleName)) return true
  return false
}

function isCareerSectionIncomplete(
  values: Pick<InstructorRegisterValidationInput, 'careerLevel' | 'careers'>,
): boolean {
  if (values.careerLevel !== CAREER_LEVEL.new && values.careerLevel !== CAREER_LEVEL.experienced) {
    return true
  }
  if (values.careerLevel === CAREER_LEVEL.new) return false
  if (values.careers.length === 0) return true
  return values.careers.some(isCareerRowIncomplete)
}

export function collectInstructorRegisterValidation(
  values: InstructorRegisterValidationInput,
  formatChecks: InstructorRegisterFormatChecks = {},
  options: InstructorRegisterValidationOptions = {},
): InstructorRegisterValidationResult {
  let missingRequired = false
  const formatMessages: string[] = []

  const isBirthDateIncomplete = formatChecks.isBirthDateIncomplete ?? (() => false)
  const isBirthDateValid = formatChecks.isBirthDateValid ?? (() => true)
  const isPhoneValid = formatChecks.isPhoneValid ?? isValidKoreanPhoneNumber
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

  if (
    isRequiredAddressIncomplete({
      address: values.homeAddress,
      addressDetail: values.homeAddressDetail,
      subject: 'person',
    })
  ) {
    missingRequired = true
  }
  if (isBlank(values.instructorCareer)) missingRequired = true
  if (isBlank(values.bankName)) missingRequired = true
  if (isBlank(values.accountNumber)) missingRequired = true
  if (isBlank(values.accountHolder)) missingRequired = true
  if (!values.isBusinessIncome) missingRequired = true
  if (isBlank(values.oneLineIntro)) missingRequired = true

  const requiredConsentKeys = options.requiredConsentAgreeKeys ?? DEFAULT_REQUIRED_CONSENT_KEYS
  for (const key of requiredConsentKeys) {
    if (values[key] !== ('agree' satisfies ConsentValue)) {
      missingRequired = true
    }
  }

  if (options.requireEducation && isEducationSectionIncomplete(values)) {
    missingRequired = true
  }

  if (options.requireCareer && isCareerSectionIncomplete(values)) {
    missingRequired = true
  }

  if (options.requireFreeWrite) {
    if (
      isBlank(values.freeWrite1) ||
      isBlank(values.freeWrite2) ||
      isBlank(values.freeWrite3) ||
      isBlank(values.freeWrite4)
    ) {
      missingRequired = true
    }
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
  | 'homeAddressDetail'
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

  if (
    isRequiredAddressIncomplete({
      address: values.homeAddress,
      addressDetail: values.homeAddressDetail,
      subject: 'person',
    })
  ) {
    return true
  }

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
