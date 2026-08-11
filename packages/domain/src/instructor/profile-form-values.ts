import { BUSINESS_INCOME } from './business-income.js'
import { CAREER_LEVEL } from './career-level.js'
import { CONSENT_VALUE, type ConsentValue } from './consent.js'
import type { EducationDetailKey } from './education-options.js'
import type { SchoolTeacherEmploymentStatus } from './employment-status.js'
import { GENDER, type Gender } from './gender.js'
import { INSTRUCTOR_MEMBER_TYPE, type InstructorMemberType } from './member-type.js'

/** 공유 레이어 — 기간/연도는 ISO·표시 문자열 또는 null (앱에서 Dayjs 변환) */
export type InstructorCareerRow = {
  companyName: string
  roleName: string
  /** YYYY-MM 또는 앱 표시 형식 */
  periodStart: string | null
  periodEnd: string | null
  currentlyEmployed: boolean
}

export type InstructorJaKoreaActivityRow = {
  periodStart: string | null
  periodEnd: string | null
  title: string
  note: string
}

export type InstructorLicenseOrAwardRow = {
  /** YYYY 또는 앱 표시 형식 */
  acquiredYear: string | null
  title: string
  issuer: string
  certificationId?: number
}

export type InstructorEducationSchoolRow = {
  admitYear: string | null
  gradYear: string | null
  schoolName: string
  major: string
}

export type InstructorEducationGraduateRow = InstructorEducationSchoolRow & {
  degree: string
}

/**
 * CMS·Platform 공통 강사 프로필 필드 (관리자 전용 등급·임시비번 제외)
 */
export type InstructorSharedProfileFormValues = {
  name: string
  gender: Gender
  birthDate: string
  contact: string
  email: string
  memberType: InstructorMemberType
  affiliationName: string
  affiliationNone: boolean
  schoolName: string
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  instructorCareer: string
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
  consentAdministrativeJoint: ConsentValue
  eduSchoolType: string
  eduStatus: string
  educationDetailKeys: EducationDetailKey[]
  highSchool: InstructorEducationSchoolRow
  college23Rows: InstructorEducationSchoolRow[]
  college4Rows: InstructorEducationSchoolRow[]
  graduateRows: InstructorEducationGraduateRow[]
  careerLevel: 'new' | 'experienced'
  careers: InstructorCareerRow[]
  jaKoreaRows: InstructorJaKoreaActivityRow[]
  licenseRows: InstructorLicenseOrAwardRow[]
  awardRows: InstructorLicenseOrAwardRow[]
  freeWrite1: string
  freeWrite2: string
  freeWrite3: string
  freeWrite4: string
}

export const EMPTY_INSTRUCTOR_CAREER: InstructorCareerRow = {
  companyName: '',
  roleName: '',
  periodStart: null,
  periodEnd: null,
  currentlyEmployed: false,
}

export const EMPTY_INSTRUCTOR_JA_KOREA_ROW: InstructorJaKoreaActivityRow = {
  periodStart: null,
  periodEnd: null,
  title: '',
  note: '',
}

export const EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW: InstructorLicenseOrAwardRow = {
  acquiredYear: null,
  title: '',
  issuer: '',
}

export const EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW: InstructorEducationSchoolRow = {
  admitYear: null,
  gradYear: null,
  schoolName: '',
  major: '',
}

export const EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW: InstructorEducationGraduateRow = {
  ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW,
  degree: '',
}

export const INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES: InstructorSharedProfileFormValues = {
  name: '',
  gender: GENDER.male,
  birthDate: '',
  contact: '',
  email: '',
  memberType: INSTRUCTOR_MEMBER_TYPE.general,
  affiliationName: '',
  affiliationNone: false,
  schoolName: '',
  employmentStatus: '',
  instructorCareer: '',
  isBusinessIncome: BUSINESS_INCOME.no,
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  homeAddress: '',
  homeAddressDetail: '',
  oneLineIntro: '',
  consentTermsOfService: CONSENT_VALUE.agree,
  consentPersonal: CONSENT_VALUE.agree,
  consentMarketing: CONSENT_VALUE.agree,
  consentPortrait: CONSENT_VALUE.disagree,
  consentPaymentStatement: CONSENT_VALUE.disagree,
  consentEducatorPledge: CONSENT_VALUE.disagree,
  consentSexOffenseCheck: CONSENT_VALUE.disagree,
  consentAdministrativeJoint: CONSENT_VALUE.disagree,
  eduSchoolType: '',
  eduStatus: '',
  educationDetailKeys: [],
  highSchool: { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
  college23Rows: [{ ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW }],
  college4Rows: [{ ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW }],
  graduateRows: [{ ...EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW }],
  careerLevel: CAREER_LEVEL.experienced,
  careers: [{ ...EMPTY_INSTRUCTOR_CAREER }],
  jaKoreaRows: [{ ...EMPTY_INSTRUCTOR_JA_KOREA_ROW }],
  licenseRows: [{ ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW }],
  awardRows: [{ ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW }],
  freeWrite1: '',
  freeWrite2: '',
  freeWrite3: '',
  freeWrite4: '',
}
