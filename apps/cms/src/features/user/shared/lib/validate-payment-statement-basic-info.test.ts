import { describe, expect, it } from 'vitest'
import {
  isPaymentStatementBasicInfoIncomplete,
  isPaymentStatementResidentNumberFormatInvalid,
} from '@/features/user/shared/lib/validate-payment-statement-basic-info'

describe('isPaymentStatementBasicInfoIncomplete', () => {
  const complete = {
    nameKo: '김필수',
    residentFront: '970721',
    residentBack: '1234567',
    affiliation: 'JA Korea',
    noAffiliation: false,
    addressRoad: '서울특별시 마포구',
    addressDetail: '101호',
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

  it('requires address detail for person', () => {
    expect(
      isPaymentStatementBasicInfoIncomplete({
        ...complete,
        addressDetail: '',
      })
    ).toBe(true)
  })
})

describe('isPaymentStatementResidentNumberFormatInvalid', () => {
  it('does not treat empty or one-sided input as format error', () => {
    expect(isPaymentStatementResidentNumberFormatInvalid(undefined)).toBe(false)
    expect(isPaymentStatementResidentNumberFormatInvalid({ residentFront: '', residentBack: '' })).toBe(
      false
    )
    expect(
      isPaymentStatementResidentNumberFormatInvalid({ residentFront: '970721', residentBack: '' })
    ).toBe(false)
  })

  it('rejects length or calendar-date format errors when both parts are filled', () => {
    expect(
      isPaymentStatementResidentNumberFormatInvalid({
        residentFront: '97072',
        residentBack: '1234567',
      })
    ).toBe(true)
    expect(
      isPaymentStatementResidentNumberFormatInvalid({
        residentFront: '970721',
        residentBack: '123456',
      })
    ).toBe(true)
    expect(
      isPaymentStatementResidentNumberFormatInvalid({
        residentFront: '991332',
        residentBack: '1234567',
      })
    ).toBe(true)
  })

  it('accepts YYMMDD + 7 digits including leap-day 00-02-29', () => {
    expect(
      isPaymentStatementResidentNumberFormatInvalid({
        residentFront: '970721',
        residentBack: '1234567',
      })
    ).toBe(false)
    expect(
      isPaymentStatementResidentNumberFormatInvalid({
        residentFront: '000229',
        residentBack: '1234567',
      })
    ).toBe(false)
  })
})
