import { describe, expect, it } from 'vitest'
import { INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form'
import { collectCmsInstructorRegisterValidation } from './validate-cms-instructor-register'

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

  it('자유 작성 미입력 시 missingRequired', () => {
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
      careerLevel: 'new',
      careers: [],
      freeWrite1: '',
      freeWrite2: '',
      freeWrite3: '',
      freeWrite4: '',
    })
    expect(missingRequired).toBe(true)
  })

  it('교사 회원도 자유 작성 1~4가 필수다 (소속만 학교·재직현황으로 분기)', () => {
    const teacherBase = {
      ...INITIAL_VALUES,
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
      consentTermsOfService: 'agree' as const,
      consentPersonal: 'agree' as const,
      careerLevel: 'new' as const,
      careers: [],
    }

    expect(
      collectCmsInstructorRegisterValidation({
        ...teacherBase,
        freeWrite1: '',
        freeWrite2: '',
        freeWrite3: '',
        freeWrite4: '',
      }).missingRequired
    ).toBe(true)

    expect(
      collectCmsInstructorRegisterValidation({
        ...teacherBase,
        freeWrite1: '1',
        freeWrite2: '2',
        freeWrite3: '3',
        freeWrite4: '4',
      }).missingRequired
    ).toBe(false)
  })
})
