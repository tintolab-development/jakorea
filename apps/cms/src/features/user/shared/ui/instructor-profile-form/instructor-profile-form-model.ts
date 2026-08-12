import type { Dayjs } from 'dayjs'
import {
  BUSINESS_INCOME_OPTIONS as DOMAIN_BUSINESS_INCOME_OPTIONS,
} from '@jakorea/domain/instructor/business-income'
import {
  CAREER_LEVEL_OPTIONS as DOMAIN_CAREER_LEVEL_OPTIONS,
} from '@jakorea/domain/instructor/career-level'
import {
  CONSENT_RADIO_OPTIONS as DOMAIN_CONSENT_RADIO_OPTIONS,
  TERMS_CONSENT_DESCRIPTION as DOMAIN_TERMS_CONSENT_DESCRIPTION,
  type ConsentValue,
} from '@jakorea/domain/instructor/consent'
import {
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS,
} from '@jakorea/domain/instructor/employment-status'
import { INSTRUCTOR_FREE_WRITE_ITEMS as DOMAIN_FREE_WRITE_ITEMS } from '@jakorea/domain/instructor/free-write'
import { GENDER_OPTIONS as DOMAIN_GENDER_OPTIONS } from '@jakorea/domain/instructor/gender'
import {
  INSTRUCTOR_MEMBER_TYPE_OPTIONS,
} from '@jakorea/domain/instructor/member-type'
import type { InstructorRegisterValidationInput } from '@jakorea/domain/instructor/validate-register'
import {
  EMPTY_EDUCATION_GRADUATE_ROW,
  EMPTY_EDUCATION_SCHOOL_ROW,
  type EducationDetailKey,
  type EducationGraduateRow,
  type EducationSchoolRow,
} from '@/features/user/shared/ui/instructor-register-education-section'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'

export type { ConsentValue }

export const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

/** Ant Design Radio/Select용 — domain SSOT (`value`/`label`) */
export const GENDER_OPTIONS = DOMAIN_GENDER_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export const MEMBER_TYPE_OPTIONS = INSTRUCTOR_MEMBER_TYPE_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export const EMPLOYMENT_STATUS_OPTIONS = SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS.map(
  option => ({
    label: option.label,
    value: option.value,
  }),
)

export const INSTRUCTOR_FREE_WRITE_ITEMS = DOMAIN_FREE_WRITE_ITEMS

export const CONSENT_RADIO_OPTIONS = DOMAIN_CONSENT_RADIO_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export const TERMS_CONSENT_DESCRIPTION = DOMAIN_TERMS_CONSENT_DESCRIPTION

export const TERMS_CONSENT_LABEL_WIDTH = 240 as const

export const BUSINESS_INCOME_OPTIONS = DOMAIN_BUSINESS_INCOME_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export const CAREER_LEVEL_OPTIONS = DOMAIN_CAREER_LEVEL_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export type CareerRow = {
  companyName: string
  roleName: string
  /** 월 단위 `Dayjs` (`CmsDatePicker` `picker="month"`) */
  periodStart: Dayjs | null
  periodEnd: Dayjs | null
  currentlyEmployed: boolean
}

export type JaKoreaActivityRow = {
  periodStart: Dayjs | null
  periodEnd: Dayjs | null
  title: string
  note: string
}

export type LicenseOrAwardRow = {
  acquiredYear: Dayjs | null
  title: string
  issuer: string
  /** 상세 수정 — 기존 자격증 PATCH 시 `certifications[].id` */
  certificationId?: number
}

export type InstructorRegisterModalFormValues = {
  name: string
  gender: 'male' | 'female'
  birthDate: string
  contact: string
  email: string
  memberType: 'general' | 'school_teacher'
  affiliationName: string
  affiliationNone: boolean
  schoolName: string
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  instructorCareer: string
  /** 강사비 등급 — BE `profile.defaultFeeGrade` (CMS 등록 전용) */
  instructorFeeGrade: string
  /** JA 평가 등급 — BE `profile.defaultJaGrade` (CMS 등록 전용) */
  jaEvaluationGrade: string
  isBusinessIncome: 'yes' | 'no'
  bankName: string
  accountNumber: string
  accountHolder: string
  homeAddress: string
  homeAddressDetail: string
  oneLineIntro: string
  consentTermsOfService: ConsentValue | undefined
  consentPersonal: ConsentValue | undefined
  consentMarketing: ConsentValue | undefined
  consentPortrait: ConsentValue | undefined
  consentPaymentStatement: ConsentValue | undefined
  consentEducatorPledge: ConsentValue | undefined
  consentSexOffenseCheck: ConsentValue | undefined
  /** 행정정보 공동이용 사전 동의 */
  consentAdministrativeJoint: ConsentValue | undefined
  eduSchoolType: string
  eduStatus: string
  educationDetailKeys: EducationDetailKey[]
  highSchool: EducationSchoolRow
  college23Rows: EducationSchoolRow[]
  college4Rows: EducationSchoolRow[]
  graduateRows: EducationGraduateRow[]
  careerLevel: 'new' | 'experienced'
  careers: CareerRow[]
  jaKoreaRows: JaKoreaActivityRow[]
  licenseRows: LicenseOrAwardRow[]
  awardRows: LicenseOrAwardRow[]
  freeWrite1: string
  freeWrite2: string
  freeWrite3: string
  freeWrite4: string
}

/** @alias InstructorRegisterModalFormValues */
export type InstructorProfileFormValues = InstructorRegisterModalFormValues

export const EMPTY_CAREER: CareerRow = {
  companyName: '',
  roleName: '',
  periodStart: null,
  periodEnd: null,
  currentlyEmployed: false,
}

export const EMPTY_JA_KOREA_ROW: JaKoreaActivityRow = {
  periodStart: null,
  periodEnd: null,
  title: '',
  note: '',
}

export const EMPTY_LICENSE_OR_AWARD_ROW: LicenseOrAwardRow = {
  acquiredYear: null,
  title: '',
  issuer: '',
}

export const INITIAL_VALUES: InstructorProfileFormValues = {
  name: '',
  gender: 'male',
  birthDate: '',
  contact: '',
  email: '',
  memberType: 'general',
  affiliationName: '',
  affiliationNone: false,
  schoolName: '',
  employmentStatus: '',
  instructorCareer: '',
  instructorFeeGrade: '',
  jaEvaluationGrade: '',
  isBusinessIncome: 'no',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  homeAddress: '',
  homeAddressDetail: '',
  oneLineIntro: '',
  consentTermsOfService: undefined,
  consentPersonal: undefined,
  consentMarketing: undefined,
  consentPortrait: undefined,
  consentPaymentStatement: undefined,
  consentEducatorPledge: undefined,
  consentSexOffenseCheck: undefined,
  consentAdministrativeJoint: undefined,
  eduSchoolType: '',
  eduStatus: '',
  educationDetailKeys: [],
  highSchool: { ...EMPTY_EDUCATION_SCHOOL_ROW },
  college23Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
  college4Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
  graduateRows: [{ ...EMPTY_EDUCATION_GRADUATE_ROW }],
  careerLevel: 'experienced',
  careers: [{ ...EMPTY_CAREER }],
  jaKoreaRows: [{ ...EMPTY_JA_KOREA_ROW }],
  licenseRows: [{ ...EMPTY_LICENSE_OR_AWARD_ROW }],
  awardRows: [{ ...EMPTY_LICENSE_OR_AWARD_ROW }],
  freeWrite1: '',
  freeWrite2: '',
  freeWrite3: '',
  freeWrite4: '',
}

function formatOptionalDayjs(value: Dayjs | null | undefined, pattern: string): string | null {
  if (value == null || !value.isValid()) return null
  return value.format(pattern)
}

/** 제출·검증용 — 중첩 배열만 INITIAL_VALUES로 보강 (스칼라 기본값으로 필수 누락을 가리지 않음) */
export function mergeInstructorRegisterFormValues(
  raw: Partial<InstructorRegisterModalFormValues>
): InstructorRegisterModalFormValues {
  return {
    ...INITIAL_VALUES,
    ...raw,
    educationDetailKeys: raw.educationDetailKeys ?? INITIAL_VALUES.educationDetailKeys,
    highSchool: raw.highSchool ?? INITIAL_VALUES.highSchool,
    college23Rows: raw.college23Rows ?? INITIAL_VALUES.college23Rows,
    college4Rows: raw.college4Rows ?? INITIAL_VALUES.college4Rows,
    graduateRows: raw.graduateRows ?? INITIAL_VALUES.graduateRows,
    careers: raw.careers ?? INITIAL_VALUES.careers,
    jaKoreaRows: raw.jaKoreaRows ?? INITIAL_VALUES.jaKoreaRows,
    licenseRows: raw.licenseRows ?? INITIAL_VALUES.licenseRows,
    awardRows: raw.awardRows ?? INITIAL_VALUES.awardRows,
  }
}

function mapEducationSchoolRowToValidation(row: EducationSchoolRow) {
  return {
    admitYear: formatOptionalDayjs(row.admitYear, 'YYYY'),
    gradYear: formatOptionalDayjs(row.gradYear, 'YYYY'),
    schoolName: row.schoolName,
    major: row.major,
  }
}

/** CMS Dayjs 폼 값 → domain `InstructorRegisterValidationInput` */
export function mapInstructorRegisterFormValuesToValidationInput(
  values: InstructorRegisterModalFormValues
): InstructorRegisterValidationInput {
  return {
    name: values.name,
    gender: values.gender,
    birthDate: values.birthDate,
    contact: values.contact,
    email: values.email,
    memberType: values.memberType,
    schoolName: values.schoolName,
    employmentStatus: values.employmentStatus,
    affiliationName: values.affiliationName,
    affiliationNone: values.affiliationNone,
    homeAddress: values.homeAddress,
    homeAddressDetail: values.homeAddressDetail,
    instructorCareer: values.instructorCareer,
    bankName: values.bankName,
    accountNumber: values.accountNumber,
    accountHolder: values.accountHolder,
    isBusinessIncome: values.isBusinessIncome,
    oneLineIntro: values.oneLineIntro,
    consentTermsOfService: values.consentTermsOfService as ConsentValue,
    consentPersonal: values.consentPersonal as ConsentValue,
    consentMarketing: values.consentMarketing as ConsentValue,
    consentPortrait: values.consentPortrait as ConsentValue,
    consentPaymentStatement: values.consentPaymentStatement as ConsentValue,
    consentEducatorPledge: values.consentEducatorPledge as ConsentValue,
    consentAdministrativeJoint: values.consentAdministrativeJoint as ConsentValue,
    consentSexOffenseCheck: values.consentSexOffenseCheck as ConsentValue,
    eduSchoolType: values.eduSchoolType,
    eduStatus: values.eduStatus,
    educationDetailKeys: values.educationDetailKeys ?? [],
    highSchool: mapEducationSchoolRowToValidation(values.highSchool ?? { ...EMPTY_EDUCATION_SCHOOL_ROW }),
    college23Rows: (values.college23Rows ?? []).map(mapEducationSchoolRowToValidation),
    college4Rows: (values.college4Rows ?? []).map(mapEducationSchoolRowToValidation),
    graduateRows: (values.graduateRows ?? []).map(row => ({
      ...mapEducationSchoolRowToValidation(row),
      degree: row.degree,
    })),
    careerLevel: values.careerLevel,
    careers: (values.careers ?? []).map(row => ({
      companyName: row.companyName,
      roleName: row.roleName,
      periodStart: formatOptionalDayjs(row.periodStart, 'YYYY-MM'),
      periodEnd: formatOptionalDayjs(row.periodEnd, 'YYYY-MM'),
      currentlyEmployed: row.currentlyEmployed,
    })),
    freeWrite1: values.freeWrite1,
    freeWrite2: values.freeWrite2,
    freeWrite3: values.freeWrite3,
    freeWrite4: values.freeWrite4,
  }
}

