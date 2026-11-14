import { describe, expect, it } from 'vitest'
import {
  collectAdminRegisterValidation,
  type AdminRegisterModalFormValues,
} from './admin-register-modal'

const filled: AdminRegisterModalFormValues = {
  name: '홍길동',
  gender: 'male',
  birthDate: '1990.01.01',
  contact: '010-1234-5678',
  email: 'admin@jakorea.org',
  permissionType: 'viewer',
  consentTermsOfService: 'agree',
  consentPersonalInfo: 'agree',
  consentMarketing: 'disagree',
  consentMfaSetup: 'agree',
}

describe('collectAdminRegisterValidation — 권한 유형 (QA-0394)', () => {
  it('권한 유형을 고르면 필수 누락이 아니다', () => {
    expect(collectAdminRegisterValidation(filled).missingRequired).toBe(false)
  })

  it('권한 유형을 고르지 않으면 필수 누락이다 (기본값 없음)', () => {
    expect(
      collectAdminRegisterValidation({ ...filled, permissionType: undefined }).missingRequired
    ).toBe(true)
  })

  it('목록에 없는 값(지움·전체)은 필수 누락으로 본다', () => {
    expect(
      collectAdminRegisterValidation({
        ...filled,
        permissionType: '' as unknown as AdminRegisterModalFormValues['permissionType'],
      }).missingRequired
    ).toBe(true)
  })
})

describe('collectAdminRegisterValidation — 이메일 도메인 (@jakorea.org)', () => {
  it('@jakorea.org 이메일은 도메인 오류가 아니다 (대소문자 무관)', () => {
    expect(collectAdminRegisterValidation(filled).emailDomainInvalid).toBe(false)
    expect(
      collectAdminRegisterValidation({ ...filled, email: 'Admin@JAKOREA.ORG' }).emailDomainInvalid
    ).toBe(false)
  })

  it('형식은 맞지만 다른 도메인이면 도메인 오류다', () => {
    const result = collectAdminRegisterValidation({ ...filled, email: 'sd@dd.dd' })
    expect(result.emailDomainInvalid).toBe(true)
    expect(result.missingRequired).toBe(false)
    expect(result.formatMessages).toEqual([])
  })

  it('이메일 형식 자체가 틀리면 형식 안내를 우선하고 도메인 오류로 보지 않는다', () => {
    const result = collectAdminRegisterValidation({ ...filled, email: 'not-an-email' })
    expect(result.emailDomainInvalid).toBe(false)
    expect(result.formatMessages).toContain('올바른 이메일 형식이 아닙니다')
  })

  it('이메일이 비어 있으면 필수 누락이며 도메인 오류로 보지 않는다', () => {
    const result = collectAdminRegisterValidation({ ...filled, email: '' })
    expect(result.missingRequired).toBe(true)
    expect(result.emailDomainInvalid).toBe(false)
  })
})
