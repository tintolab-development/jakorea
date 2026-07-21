import { describe, expect, it } from 'vitest'
import { mapCreateUserRequestToPreRegister } from './map-pre-register-request'
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
    expect(toApiBirthDate('')).toBeUndefined()
  })

  it('표시용 성별을 한글로 변환한다', () => {
    expect(toDisplayGender('M')).toBe('남성')
    expect(toDisplayGender('F')).toBe('여성')
    expect(toDisplayGender('MALE')).toBe('남성')
    expect(toDisplayGender(undefined)).toBe('-')
  })
})

describe('mapCreateUserRequestToPreRegister', () => {
  it('성별·생년월일을 API 형식으로 매핑한다', () => {
    const body = mapCreateUserRequestToPreRegister({
      email: 'a@test.com',
      password: 'Temp1234!',
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
