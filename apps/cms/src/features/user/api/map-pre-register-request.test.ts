import { describe, expect, it } from 'vitest'
import { mapCreateUserRequestToPreRegisterIndividual } from './map-pre-register-request'
import { ADMIN_PRE_REGISTER_TERMS_VERSION } from './build-pre-register-terms-agreements'

describe('mapCreateUserRequestToPreRegisterIndividual', () => {
  it('termsAgreements를 pre-register body에 포함한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'user@test.com',
      password: 'TempPass1!',
      name: '홍길동',
      role: 'INDIVIDUAL',
      isActive: true,
      termsAgreements: [
        {
          termsType: 'SERVICE_TERMS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: true,
          agreed: true,
        },
        {
          termsType: 'MARKETING',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: true,
        },
      ],
    })

    expect(body.termsAgreements).toHaveLength(2)
    expect(body.termsAgreements?.[1]).toMatchObject({
      termsType: 'MARKETING',
      agreed: true,
    })
  })

  it('선택 약관 agreed:false 는 wire에서 제외한다 (BE 400 우회)', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'user@test.com',
      password: 'TempPass1!',
      name: '홍길동',
      role: 'INDIVIDUAL',
      isActive: true,
      termsAgreements: [
        {
          termsType: 'SERVICE_TERMS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: true,
          agreed: true,
        },
        {
          termsType: 'PRIVACY_COLLECTION',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: true,
          agreed: true,
        },
        {
          termsType: 'MARKETING',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: false,
        },
        {
          termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: false,
        },
      ],
    })

    expect(body.termsAgreements?.map(row => row.termsType)).toEqual([
      'SERVICE_TERMS',
      'PRIVACY_COLLECTION',
    ])
  })
})
