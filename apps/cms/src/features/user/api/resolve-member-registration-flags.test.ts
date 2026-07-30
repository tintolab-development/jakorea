import { describe, expect, it } from 'vitest'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from './resolve-member-registration-flags'

describe('resolveRegisteredByAdmin', () => {
  it('uses explicit registeredByAdmin', () => {
    expect(resolveRegisteredByAdmin({ registeredByAdmin: true })).toBe(true)
  })

  it('infers from adminAccountId for ADMIN role', () => {
    expect(
      resolveRegisteredByAdmin({ role: 'ADMIN', adminAccountId: 42 })
    ).toBe(true)
  })

  it('does not infer adminAccountId for non-ADMIN roles', () => {
    expect(
      resolveRegisteredByAdmin({ role: 'INDIVIDUAL', adminAccountId: 42 })
    ).toBe(false)
  })
})

describe('resolveIdentitySelfSignupCompletedAfterAdminRegistration', () => {
  it('does not treat identityVerified alone as self-signup for admin-provisioned ADMIN', () => {
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role: 'ADMIN',
        adminAccountId: 1,
        identityVerified: true,
      })
    ).toBe(false)
  })

  it('uses explicit self-signup flag when set', () => {
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role: 'ADMIN',
        adminAccountId: 1,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(true)
  })

  it('falls back to identityVerified for direct members', () => {
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role: 'INDIVIDUAL',
        identityVerified: true,
      })
    ).toBe(true)
  })
})
