import { describe, expect, it } from 'vitest'
import {
  formatPayeeGenderBirthDisplay,
  mapSettlementPayeeToInstructorBasicFields,
  splitMaskedResidentRegistrationNumber,
} from './map-settlement-payee'

describe('splitMaskedResidentRegistrationNumber', () => {
  it('하이픈 기준으로 나눈다', () => {
    expect(splitMaskedResidentRegistrationNumber('900101-*******')).toEqual({
      residentFront: '900101',
      residentBack: '*******',
    })
  })
})

describe('formatPayeeGenderBirthDisplay', () => {
  it('BE 마스킹 성별·생년월일 문자열을 그대로 조합한다', () => {
    expect(formatPayeeGenderBirthDisplay({ gender: '**', birthDate: '1990-**-**' })).toBe(
      '** | 1990-**-**'
    )
  })

  it('한쪽만 있으면 나머지는 -', () => {
    expect(formatPayeeGenderBirthDisplay({ gender: null, birthDate: '1990-**-**' })).toBe(
      '- | 1990-**-**'
    )
    expect(formatPayeeGenderBirthDisplay({ gender: null, birthDate: null })).toBe('-')
  })
})

describe('mapSettlementPayeeToInstructorBasicFields', () => {
  it('payee null이면 null', () => {
    expect(mapSettlementPayeeToInstructorBasicFields(null)).toBeNull()
    expect(mapSettlementPayeeToInstructorBasicFields(undefined)).toBeNull()
  })

  it('MASKED payee 문자열을 가공 없이 표시용 필드로 매핑한다', () => {
    const mapped = mapSettlementPayeeToInstructorBasicFields({
      nameEn: 'L*e',
      phone: '010-****-1234',
      email: 'lee-***@example.com',
      gender: '**',
      birthDate: '1990-**-**',
      addressRoad: '서울시 강남구 ***',
      addressDetail: '***',
      bankName: '국민은행',
      accountNumber: '***********',
      accountHolder: '이*',
      affiliation: 'JA**',
      residentRegistrationNumber: '900101-*******',
      privacyMaskingLevel: 'MASKED',
    })

    expect(mapped).toEqual({
      nameEn: 'L*e',
      phoneDisplay: '010-****-1234',
      emailDisplay: 'lee-***@example.com',
      addressDisplay: '서울시 강남구 *** ***',
      addressRoad: '서울시 강남구 ***',
      addressDetail: '***',
      settlementAccountBankNumberPart: '국민은행 ***********',
      settlementAccountHolderPart: '이*',
      genderBirthDisplay: '** | 1990-**-**',
      affiliation: 'JA**',
      residentRegistrationNumber: '900101-*******',
    })
  })
})
