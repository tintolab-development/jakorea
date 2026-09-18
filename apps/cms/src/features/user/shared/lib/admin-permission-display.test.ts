import { describe, expect, it } from 'vitest'
import {
  getAdminPermissionVariant,
  roleCodeToAdminPermissionVariant,
} from './admin-permission-display'

describe('getAdminPermissionVariant', () => {
  it('listMetrics가 있으면 최우선한다', () => {
    expect(
      getAdminPermissionVariant({
        roleCode: 'VIEWER',
        listMetrics: { adminPermissionVariant: 'manager' },
      })
    ).toBe('manager')
  })

  it('세션 roleCode(/api/admin/me)를 권한 유형으로 매핑한다', () => {
    expect(getAdminPermissionVariant({ roleCode: 'MASTER' })).toBe('manager')
    expect(getAdminPermissionVariant({ roleCode: 'PM' })).toBe('partner')
    expect(getAdminPermissionVariant({ roleCode: 'VIEWER' })).toBe('viewer')
    // OpenAPI MIDDLE은 세션 AdminRoleCode 밖 — 문자열 매퍼로 검증
    expect(roleCodeToAdminPermissionVariant('MIDDLE')).toBe('partner')
  })

  it('roleCode가 없으면 programRoles·adminLevel로 추론한다', () => {
    expect(
      getAdminPermissionVariant({
        programRoles: { p1: 'OWNER' },
      })
    ).toBe('manager')
    expect(getAdminPermissionVariant({ adminLevel: 'ADMIN' })).toBe('partner')
    expect(getAdminPermissionVariant({})).toBe('viewer')
  })
})
