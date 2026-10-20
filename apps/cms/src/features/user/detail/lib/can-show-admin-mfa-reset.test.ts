import { describe, expect, it } from 'vitest'
import { canShowAdminMfaReset, resolveExplicitAdminPermissionVariant } from './can-show-admin-mfa-reset'

const visible = {
  sessionRoleCode: 'MASTER',
  sessionAdminAccountId: 1,
  targetRole: 'ADMIN',
  targetAdminAccountId: 2,
  targetIsActive: true,
  targetPermissionVariant: 'partner' as const,
}

describe('canShowAdminMfaReset', () => {
  it('MASTER가 활성 non-MASTER 다른 관리자에게만 보인다', () => {
    expect(canShowAdminMfaReset(visible)).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: 'viewer' })).toBe(true)
  })

  it('MASTER가 아니거나 자기 자신, MASTER 대상, 비활성 대상에는 숨긴다', () => {
    expect(canShowAdminMfaReset({ ...visible, sessionRoleCode: 'PM' })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, targetAdminAccountId: 1 })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: 'manager' })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, targetIsActive: false })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: null })).toBe(false)
  })
})

describe('resolveExplicitAdminPermissionVariant', () => {
  it('목록 지표가 없으면 roleCode로 판단하고 없으면 null이다', () => {
    expect(
      resolveExplicitAdminPermissionVariant({
        roleCode: 'VIEWER',
      })
    ).toBe('viewer')
    expect(resolveExplicitAdminPermissionVariant({})).toBeNull()
  })
})
