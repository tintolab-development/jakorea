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
  /** 자유 작성 1~4 필수. CMS 등록·Platform 강사 신청 모두 선택이라 현재 미사용 */
  requireFreeWrite?: boolean
}

/**
 * 비어 있는 필수 항목 키 (화면 순서). 앱이 자기 화면 라벨로 바꿔 「필수 항목 미입력」 팝업에 쓴다.
 * - 입력 값 키: 기본 정보·동의·자유 작성
 * - 학력: `eduSchoolType`/`eduStatus`(최종 학력), `highSchool`·`college23Rows`·`college4Rows`·`graduateRows`(학력 상세 행)
 * - 경력: `careerLevel`(경력 구분), `careers`(경력 행)
 */
export type InstructorRegisterMissingKey = keyof InstructorRegisterValidationInput

export type InstructorRegisterValidationResult = {
  missingRequired: boolean
  /** 비어 있는 필수 항목 키 (중복 없음, 화면 순서). `missingRequired`가 true면 1개 이상 */
  missingRequiredKeys: InstructorRegisterMissingKey[]
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

function collectEducationSectionMissingKeys(
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
): InstructorRegisterMissingKey[] {
  const missing: InstructorRegisterMissingKey[] = []
  if (isBlank(values.eduSchoolType)) missing.push('eduSchoolType')
  if (isBlank(values.eduStatus)) missing.push('eduStatus')
  // 최종 학력이 비어 있으면 학력 상세는 따지지 않는다 (기존 판정과 동일)
  if (missing.length > 0) return missing

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
          missing.push('highSchool')
        }
        break
      case 'college23':
        if (
          values.college23Rows.length === 0 ||
          values.college23Rows.some(row =>
            isEducationSchoolRowIncomplete(row, {
              requireMajor: true,
              requireGradYear: requireGradYearFor('college23'),
            }),
          )
        ) {
          missing.push('college23Rows')
        }
        break
      case 'college4':
        if (
          values.college4Rows.length === 0 ||
          values.college4Rows.some(row =>
            isEducationSchoolRowIncomplete(row, {
              requireMajor: true,
              requireGradYear: requireGradYearFor('college4'),
            }),
          )
        ) {
          missing.push('college4Rows')
        }
        break
      case 'graduate':
        if (
          values.graduateRows.length === 0 ||
          values.graduateRows.some(row =>
            isEducationGraduateRowIncomplete(row, requireGradYearFor('graduate')),
          )
        ) {
          missing.push('graduateRows')
        }
        break
      default:
        break
    }
  }

  return missing
}

function isCareerRowIncomplete(row: InstructorCareerRow): boolean {
  if (isBlank(row.periodStart)) return true
  if (!row.currentlyEmployed && isBlank(row.periodEnd)) return true
  if (isBlank(row.companyName)) return true
  if (isBlank(row.roleName)) return true
  return false
}

function collectCareerSectionMissingKeys(
  values: Pick<InstructorRegisterValidationInput, 'careerLevel' | 'careers'>,
): InstructorRegisterMissingKey[] {
  if (values.careerLevel !== CAREER_LEVEL.new && values.careerLevel !== CAREER_LEVEL.experienced) {
    return ['careerLevel']
  }
  if (values.careerLevel === CAREER_LEVEL.new) return []
  if (values.careers.length === 0 || values.careers.some(isCareerRowIncomplete)) return ['careers']
  return []
}

export function collectInstructorRegisterValidation(
  values: InstructorRegisterValidationInput,
  formatChecks: InstructorRegisterFormatChecks = {},
  options: InstructorRegisterValidationOptions = {},
): InstructorRegisterValidationResult {
  const missingKeys: InstructorRegisterMissingKey[] = []
  const markMissing = (key: InstructorRegisterMissingKey) => {
    if (!missingKeys.includes(key)) missingKeys.push(key)
  }
  const formatMessages: string[] = []

  const isBirthDateIncomplete = formatChecks.isBirthDateIncomplete ?? (() => false)
  const isBirthDateValid = formatChecks.isBirthDateValid ?? (() => true)
  const isPhoneValid = formatChecks.isPhoneValid ?? isValidKoreanPhoneNumber
  const isEmailValid =
    formatChecks.isEmailValid ?? ((value: string) => DEFAULT_EMAIL_PATTERN.test(value))

  if (isBlank(values.name)) markMissing('name')
  if (!values.gender) markMissing('gender')

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateIncomplete(birthDate)) {
    markMissing('birthDate')
  } else if (!isBirthDateValid(birthDate)) {
    formatMessages.push('올바른 생년월일을 입력해 주세요.')
  }

  const contact = values.contact?.trim()
  if (!contact) {
    markMissing('contact')
  } else if (!isPhoneValid(contact)) {
    formatMessages.push('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
  }

  const email = values.email?.trim()
  if (!email) {
    markMissing('email')
  } else if (!isEmailValid(email)) {
    formatMessages.push('올바른 이메일 형식이 아닙니다')
  }

  if (!values.memberType) markMissing('memberType')

  if (values.memberType === ('school_teacher' satisfies InstructorMemberType)) {
    if (isBlank(values.schoolName)) markMissing('schoolName')
    if (!values.employmentStatus) markMissing('employmentStatus')
  } else if (!values.affiliationNone && isBlank(values.affiliationName)) {
    markMissing('affiliationName')
  }

  if (
    isRequiredAddressIncomplete({
      address: values.homeAddress,
      addressDetail: values.homeAddressDetail,
      subject: 'person',
    })
  ) {
    markMissing('homeAddress')
  }
  if (isBlank(values.instructorCareer)) markMissing('instructorCareer')
  if (!values.isBusinessIncome) markMissing('isBusinessIncome')
  if (isBlank(values.oneLineIntro)) markMissing('oneLineIntro')

  const requiredConsentKeys = options.requiredConsentAgreeKeys ?? DEFAULT_REQUIRED_CONSENT_KEYS
  for (const key of requiredConsentKeys) {
    if (values[key] !== ('agree' satisfies ConsentValue)) {
      markMissing(key)
    }
  }

  if (options.requireEducation) {
    collectEducationSectionMissingKeys(values).forEach(markMissing)
  }

  if (options.requireCareer) {
    collectCareerSectionMissingKeys(values).forEach(markMissing)
  }

  if (options.requireFreeWrite) {
    for (const key of ['freeWrite1', 'freeWrite2', 'freeWrite3', 'freeWrite4'] as const) {
      if (isBlank(values[key])) markMissing(key)
    }
  }

  return {
    missingRequired: missingKeys.length > 0,
    missingRequiredKeys: missingKeys,
    formatMessages,
  }
}

export type InstructorConsentBasicInfoInput = Pick<
  InstructorSharedProfileFormValues,
  | 'name'
  | 'birthDate'
  | 'contact'
  | 'email'
  | 'homeAddress'
  | 'homeAddressDetail'
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

  if (values.memberType === 'school_teacher') {
    if (!values.schoolName?.trim()) return true
  } else if (!values.affiliationNone && !values.affiliationName?.trim()) {
    return true
  }

  return false
}
