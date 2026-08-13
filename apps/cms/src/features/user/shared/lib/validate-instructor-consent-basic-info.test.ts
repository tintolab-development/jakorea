import { describe, expect, it } from 'vitest'
import { INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form/instructor-profile-form-model'
import { isInstructorRegisterBasicInfoIncompleteForConsent } from '@/features/user/shared/lib/validate-instructor-consent-basic-info'

describe('isInstructorRegisterBasicInfoIncompleteForConsent', () => {
  const completeGeneral: typeof INITIAL_VALUES = {
    ...INITIAL_VALUES,
    name: '홍길동',
    birthDate: '1990.05.01',
    contact: '010-1234-5678',
    email: 'test@example.com',
    homeAddress: '서울특별시 강남구',
    homeAddressDetail: '101호',
    bankName: 'KB국민은행',
    accountNumber: '1234567890',
    accountHolder: '홍길동',
    affiliationName: 'JA Korea',
  }

  it('returns true when required basic info is missing', () => {
    expect(isInstructorRegisterBasicInfoIncompleteForConsent(undefined)).toBe(true)
    expect(isInstructorRegisterBasicInfoIncompleteForConsent(INITIAL_VALUES)).toBe(true)
    expect(
      isInstructorRegisterBasicInfoIncompleteForConsent({ ...completeGeneral, name: '' })
    ).toBe(true)
  })

  it('returns false when general member basic info is complete', () => {
    expect(isInstructorRegisterBasicInfoIncompleteForConsent(completeGeneral)).toBe(false)
  })

  it('requires school name for school teacher member type', () => {
    expect(
      isInstructorRegisterBasicInfoIncompleteForConsent({
        ...completeGeneral,
        memberType: 'school_teacher',
        schoolName: '',
      })
    ).toBe(true)

    expect(
      isInstructorRegisterBasicInfoIncompleteForConsent({
        ...completeGeneral,
        memberType: 'school_teacher',
        schoolName: '○○고등학교',
      })
    ).toBe(false)
  })

  it('allows affiliation none without affiliation name for general member', () => {
    expect(
      isInstructorRegisterBasicInfoIncompleteForConsent({
        ...completeGeneral,
        affiliationName: '',
        affiliationNone: true,
      })
    ).toBe(false)
  })

  it('requires home address detail for person', () => {
    expect(
      isInstructorRegisterBasicInfoIncompleteForConsent({
        ...completeGeneral,
        homeAddressDetail: '',
      })
    ).toBe(true)
  })
})
