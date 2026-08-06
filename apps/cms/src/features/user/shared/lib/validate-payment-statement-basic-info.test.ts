import { describe, expect, it } from 'vitest'
import { isPaymentStatementBasicInfoIncomplete } from '@/features/user/shared/lib/validate-payment-statement-basic-info'

describe('isPaymentStatementBasicInfoIncomplete', () => {
  const complete = {
    nameKo: '김필수',
    residentFront: '970721',
    residentBack: '1234567',
    affiliation: 'JA Korea',
    noAffiliation: false,
    addressRoad: '서울특별시 마포구',
    bankName: '우리은행',
    accountNumber: '1002859723089',
    accountHolder: '김필수',
  }

  it('returns true when required fields are missing', () => {
    expect(isPaymentStatementBasicInfoIncomplete(undefined)).toBe(true)
    expect(isPaymentStatementBasicInfoIncomplete({ nameKo: '김필수' })).toBe(true)
    expect(
      isPaymentStatementBasicInfoIncomplete({ ...complete, residentBack: '' })
    ).toBe(true)
  })

  it('returns false when all required fields are filled', () => {
    expect(isPaymentStatementBasicInfoIncomplete(complete)).toBe(false)
  })

  it('allows empty affiliation when noAffiliation is true', () => {
    expect(
      isPaymentStatementBasicInfoIncomplete({
        ...complete,
        affiliation: '',
        noAffiliation: true,
      })
    ).toBe(false)
  })
})
