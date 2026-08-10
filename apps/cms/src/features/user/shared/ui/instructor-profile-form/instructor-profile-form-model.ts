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
  consentTermsOfService: ConsentValue
  consentPersonal: ConsentValue
  consentMarketing: ConsentValue
  consentPortrait: ConsentValue
  consentPaymentStatement: ConsentValue
  consentEducatorPledge: ConsentValue
  consentSexOffenseCheck: ConsentValue
  /** 행정정보 공동이용 사전 동의 */
  consentAdministrativeJoint: ConsentValue
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
  consentTermsOfService: 'agree',
  consentPersonal: 'agree',
  consentMarketing: 'agree',
  consentPortrait: 'disagree',
  consentPaymentStatement: 'disagree',
  consentEducatorPledge: 'disagree',
  consentSexOffenseCheck: 'disagree',
  consentAdministrativeJoint: 'disagree',
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
