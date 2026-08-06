import type { Dayjs } from 'dayjs'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  EMPTY_EDUCATION_GRADUATE_ROW,
  EMPTY_EDUCATION_SCHOOL_ROW,
  type EducationDetailKey,
  type EducationGraduateRow,
  type EducationSchoolRow,
} from '@/features/user/shared/ui/instructor-register-education-section'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'

export const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

export const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
] as const

export const MEMBER_TYPE_OPTIONS = [
  { label: '일반 회원', value: 'general' },
  { label: '교사 회원', value: 'school_teacher' },
] as const

export const EMPLOYMENT_STATUS_OPTIONS = SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS.map(
  value => ({
    label: SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[value],
    value,
  })
)

export const INSTRUCTOR_FREE_WRITE_ITEMS = [
  {
    name: 'freeWrite1' as const,
    label: '1. 자기소개 및 지원동기',
  },
  {
    name: 'freeWrite2' as const,
    label: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
  },
  {
    name: 'freeWrite3' as const,
    label:
      '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
  },
  {
    name: 'freeWrite4' as const,
    label:
      '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
  },
] as const

export type ConsentValue = 'agree' | 'disagree'

export const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

export const TERMS_CONSENT_DESCRIPTION =
  '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

export const TERMS_CONSENT_LABEL_WIDTH = 240 as const

export const BUSINESS_INCOME_OPTIONS = [
  { label: '해당', value: 'yes' },
  { label: '해당 없음', value: 'no' },
]

export const CAREER_LEVEL_OPTIONS = [
  { label: '신입', value: 'new' },
  { label: '경력', value: 'experienced' },
]

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
