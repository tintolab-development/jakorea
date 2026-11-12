import { describe, expect, it } from 'vitest'
import {
  collectAdminRegisterValidation,
  type AdminRegisterModalFormValues,
} from './admin-register-modal'

const filled: AdminRegisterModalFormValues = {
  name: '홍길동',
  gender: 'male',
  birthDate: '1990-01-01',
  contact: '010-1234-5678',
  email: 'admin@example.com',
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
