import { describe, expect, it } from 'vitest'
import {
  buildInstructorRegisterPaymentStatementProfileValues,
  buildMemberPaymentStatementBasicInfoAutofill,
} from '@/features/user/shared/lib/build-member-payment-statement-consent-autofill'

describe('buildMemberPaymentStatementBasicInfoAutofill', () => {
  it('maps instructor register form fields to payment statement basic info', () => {
    expect(
      buildMemberPaymentStatementBasicInfoAutofill({
        name: '홍길동',
        birthDate: '1990.05.01',
        homeAddress: '서울특별시 강남구',
        homeAddressDetail: '101호',
        memberType: 'school_teacher',
        schoolName: '○○고등학교',
      })
    ).toEqual({
      paymentPurpose: '강사비 또는 활동비 지급',
      nameKo: '홍길동',
      residentFront: '900501',
      addressRoad: '서울특별시 강남구',
      addressDetail: '101호',
      accountHolder: '홍길동',
      affiliation: '○○고등학교',
    })
  })

  it('instructor register profile values copy name, affiliation, and address only', () => {
    expect(
      buildInstructorRegisterPaymentStatementProfileValues({
        name: '홍길동',
        birthDate: '1990.05.01',
        homeAddress: '서울특별시 강남구',
        homeAddressDetail: '101호',
        memberType: 'general',
        affiliationName: 'JA Korea',
      })
    ).toEqual({
      nameKo: '홍길동',
      affiliation: 'JA Korea',
      noAffiliation: false,
      addressRoad: '서울특별시 강남구',
      addressDetail: '101호',
    })
  })

  it('marks no affiliation when affiliationNone is true', () => {
    expect(
      buildMemberPaymentStatementBasicInfoAutofill({
        name: '김철수',
        affiliationNone: true,
        memberType: 'general',
      })
    ).toEqual({
      paymentPurpose: '강사비 또는 활동비 지급',
      nameKo: '김철수',
      accountHolder: '김철수',
      noAffiliation: true,
    })
  })
})
