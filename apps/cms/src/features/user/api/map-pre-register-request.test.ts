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
          agreed: false,
        },
      ],
    })

    expect(body.termsAgreements).toHaveLength(2)
    expect(body.termsAgreements?.[1]).toMatchObject({
      termsType: 'MARKETING',
      agreed: false,
    })
  })
})
