import { describe, expect, it } from 'vitest'
import { isScreenOwnedApiError } from './screen-owned-api-errors'

describe('isScreenOwnedApiError', () => {
  it('재인증 불일치 3종은 화면이 「본인인증 실패」를 띄운다', () => {
    for (const code of [
      'IDENTITY_VERIFICATION_NAME_MISMATCH',
      'IDENTITY_VERIFICATION_BIRTH_DATE_MISMATCH',
      'IDENTITY_VERIFICATION_GENDER_MISMATCH',
    ]) {
      expect(
        isScreenOwnedApiError({ url: '/api/admin/me/identity-contact', code, field: undefined })
      ).toBe(true)
    }
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/me/identity-contact',
        code: 'INTERNAL_ERROR',
        field: undefined,
      })
    ).toBe(false)
  })

  it('관리자 기본정보 수정의 field=email 오류만 입력란 표시 대상이다', () => {
    const url = '/api/admin/admin-accounts/12/basic-info'
    expect(isScreenOwnedApiError({ url, code: 'EMAIL_ALREADY_EXISTS', field: 'email' })).toBe(true)
    expect(
      isScreenOwnedApiError({ url, code: 'ADMIN_BASIC_INFO_EDIT_NOT_ALLOWED', field: undefined })
    ).toBe(false)
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/members/3/basic-info',
        code: 'EMAIL_ALREADY_EXISTS',
        field: 'email',
      })
    ).toBe(false)
  })

  it('관리자 등록·개인·강사 사전등록의 본인 정보 중복이 대상이다', () => {
    const code = 'ADMIN_IDENTITY_ALREADY_REGISTERED'
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/users/pre-register/individual',
        code,
        field: undefined,
      })
    ).toBe(true)
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/users/pre-register/instructor',
        code,
        field: undefined,
      })
    ).toBe(true)
    expect(
      isScreenOwnedApiError({ url: '/api/admin/admin-accounts', code, field: undefined })
    ).toBe(true)
    // 관리자 기본정보 수정 등 다른 관리자 경로는 제외
    expect(
      isScreenOwnedApiError({ url: '/api/admin/admin-accounts/12/role', code, field: undefined })
    ).toBe(false)
    // 관리자 이메일 중복은 전역 알럿(서버 문구)
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/admin-accounts',
        code: 'ADMIN_EMAIL_ALREADY_EXISTS',
        field: 'email',
      })
    ).toBe(false)
    expect(
      isScreenOwnedApiError({
        url: '/api/admin/users/pre-register/individual',
        code: 'EMAIL_ALREADY_EXISTS',
        field: 'email',
      })
    ).toBe(false)
  })
})
