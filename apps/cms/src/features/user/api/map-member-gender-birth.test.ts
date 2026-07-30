import { describe, expect, it } from 'vitest'
import { mapCreateUserRequestToPreRegister } from './map-pre-register-request'
import {
  mapCreateUserRequestToPreRegisterIndividual,
  mapCreateUserRequestToPreRegisterInstructor,
  mapCreateUserRequestToPreRegisterSchool,
} from './map-pre-register-request'
import { toApiBirthDate, toApiGender, toDisplayGender } from './map-member-gender-birth'

describe('map-member-gender-birth', () => {
  it('성별을 API 코드로 변환한다', () => {
    expect(toApiGender('male')).toBe('M')
    expect(toApiGender('여성')).toBe('F')
    expect(toApiGender('F')).toBe('F')
    expect(toApiGender('MALE')).toBe('M')
    expect(toApiGender('')).toBeUndefined()
  })

  it('생년월일을 YYYY-MM-DD로 변환한다', () => {
    expect(toApiBirthDate('1990.01.15')).toBe('1990-01-15')
    expect(toApiBirthDate('1990-01-15')).toBe('1990-01-15')
    expect(toApiBirthDate('19900115')).toBe('1990-01-15')
    expect(toApiBirthDate('1990-01-15T00:00:00Z')).toBe('1990-01-15')
    expect(toApiBirthDate('')).toBeUndefined()
  })

  it('표시용 성별을 한글로 변환한다', () => {
    expect(toDisplayGender('M')).toBe('남성')
    expect(toDisplayGender('F')).toBe('여성')
    expect(toDisplayGender('MALE')).toBe('남성')
    expect(toDisplayGender('1')).toBe('남성')
    expect(toDisplayGender('2')).toBe('여성')
    expect(toDisplayGender('남자')).toBe('남성')
    expect(toDisplayGender(undefined)).toBe('-')
    expect(toDisplayGender('unknown')).toBe('-')
  })
})

describe('mapCreateUserRequestToPreRegister', () => {
  it('성별·생년월일을 API 형식으로 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegister({
      email: 'a@test.com',
      password: 'a@test.com',
      name: '홍길동',
      phone: '010-1234-5678',
      gender: '남성',
      birthDate: '1990.01.15',
      role: 'INDIVIDUAL',
      isActive: true,
    })

    expect(body.gender).toBe('M')
    expect(body.birthDate).toBe('1990-01-15')
  })
})

describe('mapCreateUserRequestToPreRegisterIndividual', () => {
  it('개인 등록 요청을 역할별 스키마로 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'a@test.com',
      password: 'a@test.com',
      name: '홍길동',
      phone: '010-1234-5678',
      gender: '남성',
      birthDate: '19900115',
      role: 'INDIVIDUAL',
      address: '서울시 강서구 화곡동',
      detailAddress: '101호',
      schoolEnrollmentStatus: 'ENROLLED',
      id1365: '13650001',
      isActive: true,
    })

    expect(body.email).toBe('a@test.com')
    expect(body.rawPassword).toBe('a@test.com')
    expect(body.gender).toBe('M')
    expect(body.birthDate).toBe('1990-01-15')
    expect(body.address).toBe('서울시 강서구 화곡동')
    expect(body.addressDetail).toBe('101호')
    expect(body.enrollmentStatus).toBe('ENROLLED')
    expect(body.external1365Id).toBe('13650001')
  })
})

describe('mapCreateUserRequestToPreRegisterSchool', () => {
  it('학교 등록 요청을 organizationName·address로 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegisterSchool({
      email: 'school@test.com',
      password: 'school@test.com',
      name: '화곡중학교',
      role: 'SCHOOL',
      schoolInfo: {
        schoolName: '화곡중학교',
        address: '서울시 강서구 화곡동 1',
      },
      isActive: true,
    })

    expect(body.organizationName).toBe('화곡중학교')
    expect(body.address).toBe('서울시 강서구 화곡동 1')
    expect(body.email).toBe('school@test.com')
  })

  it('email 없이 학교 등록 요청을 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegisterSchool({
      email: '',
      password: '',
      name: '화곡중학교',
      role: 'SCHOOL',
      schoolInfo: {
        schoolName: '화곡중학교',
        address: '서울시 강서구 화곡동 1',
      },
      isActive: true,
    })

    expect(body.email).toBeUndefined()
    expect(body.organizationName).toBe('화곡중학교')
  })

  it('neisCode·region·zipCode·phone을 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegisterSchool({
      email: 'school@test.com',
      password: 'school@test.com',
      name: '화곡중학교',
      role: 'SCHOOL',
      schoolInfo: {
        schoolName: '화곡중학교',
        address: '서울특별시 강서구 화곡로 1',
      },
      phone: '02-1234-5678',
      neisCode: 'B109000000',
      regionSido: '서울특별시',
      regionSigungu: '강서구',
      zipCode: '07755',
      isActive: true,
    })

    expect(body.phone).toBe('02-1234-5678')
    expect(body.neisCode).toBe('B109000000')
    expect(body.regionSido).toBe('서울특별시')
    expect(body.regionSigungu).toBe('강서구')
    expect(body.zipCode).toBe('07755')
  })
})

describe('mapCreateUserRequestToPreRegisterInstructor', () => {
  it('강사 등록 요청에 계좌·주소 필드를 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegisterInstructor({
      email: 'i@test.com',
      password: 'i@test.com',
      name: '강사',
      role: 'INSTRUCTOR',
      address: '자택로 1',
      detailAddress: '201호',
      instructorType: 'GENERAL',
      instructorInfo: {
        bankName: '농협',
        accountNumber: '1234',
        accountHolder: '박강사',
        isBusinessIncome: false,
      },
      isActive: true,
    })

    expect(body.homeAddress).toBe('자택로 1')
    expect(body.rawPassword).toBe('i@test.com')
    expect(body.bankName).toBe('농협')
    expect(body.businessIncome).toBe(false)
    expect(body.bankAccounts?.[0]?.bankName).toBe('농협')
  })
})
