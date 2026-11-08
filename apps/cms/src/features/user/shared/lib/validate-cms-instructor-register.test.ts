import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form'
import { collectCmsInstructorRegisterValidation } from './validate-cms-instructor-register'

const AGREED_REQUIRED_CONSENTS = {
  consentTermsOfService: 'agree' as const,
  consentPersonal: 'agree' as const,
  consentPaymentStatement: 'agree' as const,
  consentEducatorPledge: 'agree' as const,
  consentSexOffenseCheck: 'agree' as const,
}

const FILLED_EDUCATION = {
  eduSchoolType: 'high',
  eduStatus: 'graduated',
  educationDetailKeys: ['high' as const],
  highSchool: {
    admitYear: dayjs('2006-01-01'),
    gradYear: dayjs('2009-01-01'),
    schoolName: '○○고등학교',
    major: '',
  },
}

describe('collectCmsInstructorRegisterValidation', () => {
  it('기본 정보 미입력 시 missingRequired', () => {
    const { missingRequired } = collectCmsInstructorRegisterValidation({
      ...INITIAL_VALUES,
      name: '',
      birthDate: '',
      contact: '',
      email: '',
    })
    expect(missingRequired).toBe(true)
  })

  it('경력(experienced) 행 미입력 시 missingRequired', () => {
    const { missingRequired } = collectCmsInstructorRegisterValidation({
      ...INITIAL_VALUES,
      name: '홍길동',
      gender: 'male',
      birthDate: '1990-01-01',
      contact: '010-1234-5678',
      email: 'test@example.com',
      affiliationName: 'JA',
      homeAddress: '서울',
      homeAddressDetail: '101',
      instructorCareer: '5년',
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
      oneLineIntro: '소개',
      careerLevel: 'experienced',
      careers: [{ ...INITIAL_VALUES.careers[0] }],
      freeWrite1: '1',
      freeWrite2: '2',
      freeWrite3: '3',
      freeWrite4: '4',
    })
    expect(missingRequired).toBe(true)
  })

  it('자유 작성 미입력이어도 missingRequired가 아니다', () => {
    const { missingRequired } = collectCmsInstructorRegisterValidation({
      ...INITIAL_VALUES,
      ...FILLED_EDUCATION,
      name: '홍길동',
      gender: 'male',
      birthDate: '1990-01-01',
      contact: '010-1234-5678',
      email: 'test@example.com',
      affiliationName: 'JA',
      homeAddress: '서울',
      homeAddressDetail: '101',
      instructorCareer: '5년',
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
      oneLineIntro: '소개',
      ...AGREED_REQUIRED_CONSENTS,
      careerLevel: 'new',
      careers: [],
      freeWrite1: '',
      freeWrite2: '',
      freeWrite3: '',
      freeWrite4: '',
    })
    expect(missingRequired).toBe(false)
  })

  it('교사 회원도 자유 작성은 선택이되, 소속은 학교·재직현황으로 분기한다', () => {
    const teacherBase = {
      ...INITIAL_VALUES,
      ...FILLED_EDUCATION,
      name: '홍길동',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      contact: '010-1234-5678',
      email: 'test@example.com',
      memberType: 'school_teacher' as const,
      schoolName: '○○고등학교',
      employmentStatus: 'ACTIVE' as const,
      homeAddress: '서울',
      homeAddressDetail: '101',
      instructorCareer: '5년',
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
      oneLineIntro: '소개',
      ...AGREED_REQUIRED_CONSENTS,
      careerLevel: 'new' as const,
      careers: [],
      freeWrite1: '',
      freeWrite2: '',
      freeWrite3: '',
      freeWrite4: '',
    }

    expect(collectCmsInstructorRegisterValidation(teacherBase).missingRequired).toBe(false)

    expect(
      collectCmsInstructorRegisterValidation({
        ...teacherBase,
        schoolName: '',
      }).missingRequired
    ).toBe(true)
  })

  it('학력사항 미입력 시 missingRequired', () => {
    const base = {
      ...INITIAL_VALUES,
      ...FILLED_EDUCATION,
      name: '홍길동',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      contact: '010-1234-5678',
      email: 'test@example.com',
      affiliationName: 'JA',
      homeAddress: '서울',
      homeAddressDetail: '101',
      instructorCareer: '5년',
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
      oneLineIntro: '소개',
      ...AGREED_REQUIRED_CONSENTS,
      careerLevel: 'new' as const,
      careers: [],
    }
    expect(collectCmsInstructorRegisterValidation(base).missingRequired).toBe(false)
    expect(
      collectCmsInstructorRegisterValidation({ ...base, eduSchoolType: '', eduStatus: '' })
        .missingRequired
    ).toBe(true)
    expect(
      collectCmsInstructorRegisterValidation({
        ...base,
        highSchool: { ...base.highSchool, schoolName: '' },
      }).missingRequired
    ).toBe(true)
  })
})
