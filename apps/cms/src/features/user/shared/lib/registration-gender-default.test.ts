import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { registerFormGenderToApiLabel } from '@/features/user/detail/lib/profile-form-gender'
import {
  collectAdminRegisterValidation,
  type AdminRegisterModalFormValues,
} from '@/features/user/shared/ui/admin-register-modal'
import {
  collectMemberRegisterValidation,
  type AddUserIndividualFormValues,
} from '@/features/user/shared/ui/add-user-individual'
import { INITIAL_VALUES as INSTRUCTOR_INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form'
import { collectCmsInstructorRegisterValidation } from '@/features/user/shared/lib/validate-cms-instructor-register'
import {
  addStudentFormSchema,
  DEFAULT_ADD_STUDENT_FORM_VALUES,
} from '@/features/program/general/model/school-detail-add-student-schema'

/** Step 6.2 — 신규 등록 폼은 성별을 남성으로 미리 고르지 않고, 명시적 선택만 저장한다(가짜 데이터). */

const ADMIN_FILLED: AdminRegisterModalFormValues = {
  name: '홍길동',
  gender: undefined,
  birthDate: '1990-01-15',
  contact: '010-1234-5678',
  email: 'admin@example.test',
  consentTermsOfService: 'agree',
  consentPersonalInfo: 'agree',
  consentMarketing: 'disagree',
  consentMfaSetup: 'agree',
} as AdminRegisterModalFormValues

const MEMBER_FILLED = {
  name: '홍길동',
  gender: undefined,
  birthDate: '1990-01-15',
  schoolEnrollmentStatus: 'not_enrolled',
  schoolName: '',
  grade: '',
  affiliationOrganization: '',
  affiliationNone: true,
  contact: '010-1234-5678',
  email: 'member@example.test',
  address: '서울특별시 강서구 화곡로 1',
  detailAddress: '101호',
  volunteerId: '',
} as unknown as AddUserIndividualFormValues

const INSTRUCTOR_FILLED = {
  ...INSTRUCTOR_INITIAL_VALUES,
  eduSchoolType: 'high',
  eduStatus: 'graduated',
  educationDetailKeys: ['high' as const],
  highSchool: {
    admitYear: dayjs('2006-01-01'),
    gradYear: dayjs('2009-01-01'),
    schoolName: '○○고등학교',
    major: '',
  },
  name: '홍길동',
  birthDate: '1990-01-01',
  contact: '010-1234-5678',
  email: 'instructor@example.test',
  affiliationName: 'JA',
  homeAddress: '서울',
  homeAddressDetail: '101',
  instructorCareer: '5년',
  bankName: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  oneLineIntro: '소개',
  consentTermsOfService: 'agree' as const,
  consentPersonal: 'agree' as const,
  consentPaymentStatement: 'agree' as const,
  consentEducatorPledge: 'agree' as const,
  consentSexOffenseCheck: 'agree' as const,
  careerLevel: 'new' as const,
  careers: [],
}

const STUDENT_FILLED = {
  name: '김학생',
  birthDate: '20100315',
  gradeClass: '3학년 2반',
  contact: '010-2222-3333',
  email: 'student@example.test',
  notes: '',
}

describe('신규 등록 성별 payload', () => {
  it('미선택은 undefined — 남성·여성 어느 쪽으로도 추정하지 않는다', () => {
    expect(registerFormGenderToApiLabel(undefined)).toBeUndefined()
    expect(registerFormGenderToApiLabel(null)).toBeUndefined()
  })

  it('명시적으로 고른 성별만 라벨로 보낸다', () => {
    expect(registerFormGenderToApiLabel('male')).toBe('남성')
    expect(registerFormGenderToApiLabel('female')).toBe('여성')
  })
})

describe('관리자 신규 등록', () => {
  it('성별 미선택이면 필수 항목 누락으로 저장을 막는다', () => {
    expect(collectAdminRegisterValidation(ADMIN_FILLED).missingRequired).toBe(true)
  })

  it('성별을 고르면 통과한다', () => {
    expect(collectAdminRegisterValidation({ ...ADMIN_FILLED, gender: 'female' }).missingRequired).toBe(false)
    expect(collectAdminRegisterValidation({ ...ADMIN_FILLED, gender: 'male' }).missingRequired).toBe(false)
  })
})

describe('일반회원 신규 등록', () => {
  it('성별 미선택이면 필수 항목 누락으로 저장을 막는다', () => {
    expect(collectMemberRegisterValidation(MEMBER_FILLED).missingRequired).toBe(true)
  })

  it('성별을 고르면 통과한다', () => {
    expect(collectMemberRegisterValidation({ ...MEMBER_FILLED, gender: 'female' }).missingRequired).toBe(false)
  })
})

describe('강사회원 신규 등록', () => {
  it('초기값 성별은 미선택이다', () => {
    expect(INSTRUCTOR_INITIAL_VALUES.gender).toBeUndefined()
  })

  it('성별 미선택이면 필수 항목 누락, 고르면 통과한다', () => {
    expect(collectCmsInstructorRegisterValidation(INSTRUCTOR_FILLED).missingRequired).toBe(true)
    expect(
      collectCmsInstructorRegisterValidation({ ...INSTRUCTOR_FILLED, gender: 'female' }).missingRequired
    ).toBe(false)
  })
})

describe('학생 추가', () => {
  it('초기값 성별은 미선택이다', () => {
    expect(DEFAULT_ADD_STUDENT_FORM_VALUES.gender).toBeUndefined()
  })

  it('성별 미선택이면 "성별을 선택해주세요"로 막고, 고르면 통과한다', () => {
    const missing = addStudentFormSchema.safeParse({ ...STUDENT_FILLED, gender: undefined })
    expect(missing.success).toBe(false)
    expect(missing.error?.issues.find(issue => issue.path[0] === 'gender')?.message).toBe('성별을 선택해주세요')

    expect(addStudentFormSchema.safeParse({ ...STUDENT_FILLED, gender: 'female' }).success).toBe(true)
  })
})
