import { describe, expect, it } from 'vitest'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from './resolve-member-registration-flags'

describe('resolveRegisteredByAdmin', () => {
  it('uses explicit registeredByAdmin', () => {
    expect(resolveRegisteredByAdmin({ registeredByAdmin: true })).toBe(true)
  })

  it('does not treat ADMIN + adminAccountId as 관리자 등록', () => {
    expect(
      resolveRegisteredByAdmin({
        role: 'ADMIN',
        adminAccountId: 165007,
        createdByAdmin: false,
        registeredByAdmin: false,
      })
    ).toBe(false)
    expect(resolveRegisteredByAdmin({ role: 'ADMIN', adminAccountId: 42 })).toBe(false)
  })

  it('does not infer adminAccountId for non-ADMIN roles', () => {
    expect(
      resolveRegisteredByAdmin({ role: 'INDIVIDUAL', adminAccountId: 42 })
    ).toBe(false)
  })

  it('infers from preRegistered / createdByAdmin', () => {
    expect(resolveRegisteredByAdmin({ preRegistered: true })).toBe(true)
    expect(resolveRegisteredByAdmin({ createdByAdmin: true })).toBe(true)
  })

  it('defaults to false when flags are missing', () => {
    expect(resolveRegisteredByAdmin({})).toBe(false)
  })
})

describe('resolveIdentitySelfSignupCompletedAfterAdminRegistration', () => {
  it('treats identityVerified as completed for admin-provisioned members', () => {
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role: 'ADMIN',
        adminAccountId: 1,
        identityVerified: true,
      })
    ).toBe(true)
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        preRegistered: true,
        createdByAdmin: true,
        identityVerified: true,
      })
    ).toBe(true)
  })

  it('keeps admin-provisioned incomplete when identityVerified is false', () => {
    expect(
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        preRegistered: true,
        createdByAdmin: true,
        identityVerified: false,
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
