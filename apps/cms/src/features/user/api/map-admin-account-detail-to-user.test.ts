import { describe, expect, it } from 'vitest'
import { mapAdminAccountDetailToUser } from './map-admin-account-detail-to-user'

describe('mapAdminAccountDetailToUser', () => {
  it('termsAgreements·birthDate를 정규화해 매핑한다', () => {
    const user = mapAdminAccountDetailToUser({
      adminAccountId: 11,
      uuid: 'admin-detail-11',
      email: 'admin@ja.org',
      name: '관리자',
      roleCode: 'PARTNER',
      status: 'ACTIVE',
      birthDate: '1990.05.20',
      termsAgreements: [
        {
          termsType: 'SERVICE_TERMS',
          consentType: 'SERVICE_TERMS',
          version: '1.0',
          required: true,
          agreed: true,
          agreedAt: '2026-01-01T00:00:00Z',
        },
        {
          consentType: 'MARKETING',
          version: '1.0',
          required: false,
          agreed: false,
        },
      ],
    })

    expect(user.birthDate).toBe('1990-05-20')
    expect(user.termsAgreements).toEqual([
      {
        termsType: 'SERVICE_TERMS',
        termsVersion: '1.0',
        required: true,
        agreed: true,
        agreedAt: '2026-01-01T00:00:00Z',
        sourceFlow: undefined,
      },
      {
        termsType: 'MARKETING',
        termsVersion: '1.0',
        required: false,
        agreed: false,
        agreedAt: undefined,
        sourceFlow: undefined,
      },
    ])
  })
})
