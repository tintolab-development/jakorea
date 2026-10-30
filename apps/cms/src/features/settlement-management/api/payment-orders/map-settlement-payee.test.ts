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
  it('성별·생년월일을 조합한다', () => {
    expect(
      formatPayeeGenderBirthDisplay({ gender: 'M', birthDate: '1990-**-**' })
    ).toBe('남성 | 1990-**-**')
  })
})

describe('mapSettlementPayeeToInstructorBasicFields', () => {
  it('payee null이면 null', () => {
    expect(mapSettlementPayeeToInstructorBasicFields(null)).toBeNull()
    expect(mapSettlementPayeeToInstructorBasicFields(undefined)).toBeNull()
  })

  it('MASKED payee를 표시용 필드로 매핑한다', () => {
    const mapped = mapSettlementPayeeToInstructorBasicFields({
      nameEn: 'Lee',
      phone: '010-****-1234',
      email: 'lee***@example.com',
      gender: 'F',
      birthDate: '1990-**-**',
      addressRoad: '서울시 강남구',
      addressDetail: '101호',
      bankName: '국민은행',
      accountNumber: '***********',
      accountHolder: '이*',
      affiliation: 'JA',
      residentRegistrationNumber: '900101-*******',
      privacyMaskingLevel: 'MASKED',
    })

    expect(mapped).toMatchObject({
      nameEn: 'Lee',
      phoneDisplay: '010-****-1234',
      emailDisplay: 'lee***@example.com',
      genderBirthDisplay: '여성 | 1990-**-**',
      affiliation: 'JA',
      residentRegistrationNumber: '900101-*******',
      addressRoad: '서울시 강남구',
      addressDetail: '101호',
      settlementAccountBankNumberPart: '국민은행 ***********',
      settlementAccountHolderPart: '이*',
    })
    expect(mapped?.addressDisplay).toContain('서울시 강남구')
  })
})
