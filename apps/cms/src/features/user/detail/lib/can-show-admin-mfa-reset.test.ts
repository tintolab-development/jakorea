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
  it('MASTER가 활성 다른 관리자(Master 포함)에게 보인다', () => {
    expect(canShowAdminMfaReset(visible)).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: 'viewer' })).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: 'manager' })).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: 'accounting' })).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetPermissionVariant: null })).toBe(true)
    expect(
      canShowAdminMfaReset({
        ...visible,
        sessionRoleCode: 'PM',
        sessionAdminLevel: 'MASTER',
      })
    ).toBe(true)
    expect(canShowAdminMfaReset({ ...visible, targetAdminAccountId: 1 })).toBe(true)
  })

  it('MASTER가 아니거나 비활성 대상에는 숨긴다', () => {
    expect(canShowAdminMfaReset({ ...visible, sessionRoleCode: 'PM' })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, targetIsActive: false })).toBe(false)
    expect(canShowAdminMfaReset({ ...visible, sessionRoleCode: 'VIEWER' })).toBe(false)
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
