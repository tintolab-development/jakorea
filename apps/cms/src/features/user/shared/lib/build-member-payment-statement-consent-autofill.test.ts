import { describe, expect, it } from 'vitest'
import { buildMemberPaymentStatementBasicInfoAutofill } from '@/features/user/shared/lib/build-member-payment-statement-consent-autofill'

describe('buildMemberPaymentStatementBasicInfoAutofill', () => {
  it('maps instructor register form fields to payment statement basic info', () => {
    expect(
      buildMemberPaymentStatementBasicInfoAutofill({
        name: '홍길동',
        birthDate: '1990.05.01',
        homeAddress: '서울특별시 강남구',
        homeAddressDetail: '101호',
        bankName: 'KB국민은행',
        accountNumber: '1234567890',
        accountHolder: '홍길동',
        memberType: 'school_teacher',
        schoolName: '○○고등학교',
      })
    ).toEqual({
      paymentPurpose: '강사비 또는 활동비 지급',
      nameKo: '홍길동',
      residentFront: '900501',
      addressRoad: '서울특별시 강남구',
      addressDetail: '101호',
      bankName: 'KB국민은행',
      accountNumber: '1234567890',
      accountHolder: '홍길동',
      affiliation: '○○고등학교',
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
