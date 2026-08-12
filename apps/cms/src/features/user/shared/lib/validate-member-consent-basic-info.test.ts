import { describe, expect, it } from 'vitest'
import { isMemberRegisterBasicInfoIncompleteForConsent } from '@/features/user/shared/lib/validate-member-consent-basic-info'

describe('isMemberRegisterBasicInfoIncompleteForConsent', () => {
  const completeEnrolled = {
    name: '홍길동',
    birthDate: '1990.05.01',
    schoolEnrollmentStatus: 'enrolled' as const,
    schoolName: '○○고등학교',
    grade: '2',
    contact: '010-1234-5678',
    email: 'test@example.com',
    address: '서울특별시 강남구',
    detailAddress: '101호',
  }

  it('returns true when required basic info is missing', () => {
    expect(isMemberRegisterBasicInfoIncompleteForConsent(undefined)).toBe(true)
    expect(isMemberRegisterBasicInfoIncompleteForConsent({})).toBe(true)
    expect(
      isMemberRegisterBasicInfoIncompleteForConsent({ ...completeEnrolled, name: '' })
    ).toBe(true)
  })

  it('returns false when enrolled member basic info is complete', () => {
    expect(isMemberRegisterBasicInfoIncompleteForConsent(completeEnrolled)).toBe(false)
  })

  it('requires school name and grade when enrolled', () => {
    expect(
      isMemberRegisterBasicInfoIncompleteForConsent({
        ...completeEnrolled,
        schoolName: '',
      })
    ).toBe(true)

    expect(
      isMemberRegisterBasicInfoIncompleteForConsent({
        ...completeEnrolled,
        grade: '',
      })
    ).toBe(true)
  })

  it('does not require affiliation when not enrolled', () => {
    expect(
      isMemberRegisterBasicInfoIncompleteForConsent({
        name: '김철수',
        birthDate: '1990.05.01',
        schoolEnrollmentStatus: 'not_enrolled',
        contact: '010-1234-5678',
        email: 'test@example.com',
        address: '서울특별시 강남구',
        detailAddress: '101호',
      })
    ).toBe(false)
  })

  it('requires detail address for person', () => {
    expect(
      isMemberRegisterBasicInfoIncompleteForConsent({
        ...completeEnrolled,
        detailAddress: '',
      })
    ).toBe(true)
  })
})
