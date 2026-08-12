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
})
