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

  it('status·verifiedAt를 permissionApprovalStatus·permissionApprovalHandledAt에 매핑한다', () => {
    const pending = mapAdminAccountDetailToUser({
      adminAccountId: 1,
      email: 'a@ja.org',
      name: '대기',
      status: 'PENDING_VERIFICATION',
    })
    expect(pending.permissionApprovalStatus).toBe('PENDING')
    expect(pending.permissionApprovalHandledAt).toBeUndefined()

    const approved = mapAdminAccountDetailToUser({
      adminAccountId: 2,
      email: 'b@ja.org',
      name: '승인',
      status: 'ACTIVE',
      verifiedAt: '2026-02-01T09:00:00Z',
    })
    expect(approved.permissionApprovalStatus).toBe('APPROVED')
    expect(approved.permissionApprovalHandledAt).toBe('2026-02-01T09:00:00Z')

    const rejected = mapAdminAccountDetailToUser({
      adminAccountId: 3,
      email: 'c@ja.org',
      name: '반려',
      status: 'REJECTED',
      updatedAt: '2026-03-01T12:00:00Z',
    })
    expect(rejected.permissionApprovalStatus).toBe('REJECTED')
    expect(rejected.permissionApprovalHandledAt).toBe('2026-03-01T12:00:00Z')
  })

  it('REJECTED_VERIFICATION status를 REJECTED로 매핑한다', () => {
    const rejectedVerification = mapAdminAccountDetailToUser({
      adminAccountId: 5,
      email: 'e@ja.org',
      name: '반려',
      status: 'REJECTED_VERIFICATION',
    })
    expect(rejectedVerification.permissionApprovalStatus).toBe('REJECTED')
  })
})
