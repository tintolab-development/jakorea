import { describe, expect, it } from 'vitest'
import { ADMIN_PERMISSION_SETTINGS_ROLE_LABELS } from '@/pages/admin/settings/admin-permission-settings-ui-data'
import {
  ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE,
  ADMIN_PERMISSION_SELECT_OPTIONS,
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionDisplayLabel,
  getAdminPermissionVariant,
  isAdminPermissionSelectComingSoon,
  roleCodeToAdminPermissionVariant,
} from './admin-permission-display'

describe('ADMIN_PERMISSION_TAG_LABEL', () => {
  it('관리자 권한 설정 영문 역할명과 맞춘다', () => {
    expect(ADMIN_PERMISSION_TAG_LABEL.manager).toBe(
      ADMIN_PERMISSION_SETTINGS_ROLE_LABELS.master
    )
    expect(ADMIN_PERMISSION_TAG_LABEL.accounting).toBe(
      ADMIN_PERMISSION_SETTINGS_ROLE_LABELS['accounting-manager']
    )
    expect(ADMIN_PERMISSION_TAG_LABEL.partner).toBe(
      ADMIN_PERMISSION_SETTINGS_ROLE_LABELS['program-manager']
    )
    expect(ADMIN_PERMISSION_TAG_LABEL.viewer).toBe(
      ADMIN_PERMISSION_SETTINGS_ROLE_LABELS['program-viewer']
    )
    expect(ADMIN_PERMISSION_SELECT_OPTIONS.map(option => option.label)).toEqual([
      'Master',
      'Accounting Manager',
      'Program Manager',
      'Program Viewer',
    ])
    expect(ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE).toBe('accounting')
    expect(
      isAdminPermissionSelectComingSoon(ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE)
    ).toBe(false)
    expect(isAdminPermissionSelectComingSoon('partner')).toBe(false)
  })
})

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
    expect(roleCodeToAdminPermissionVariant('ACCOUNTING_MANAGER')).toBe('accounting')
    expect(getAdminPermissionVariant({ roleCode: 'PM' })).toBe('partner')
    expect(getAdminPermissionVariant({ roleCode: 'VIEWER' })).toBe('viewer')
    // OpenAPI MIDDLE은 세션 AdminRoleCode 밖 — 문자열 매퍼로 검증
    expect(roleCodeToAdminPermissionVariant('MIDDLE')).toBe('partner')
  })

  it('roleCode 표시명을 새 권한 명칭으로 반환한다', () => {
    expect(getAdminPermissionDisplayLabel({ roleCode: 'MASTER' })).toBe('Master')
    expect(getAdminPermissionDisplayLabel({ roleCode: 'ACCOUNTING_MANAGER' })).toBe(
      'Accounting Manager'
    )
    expect(getAdminPermissionDisplayLabel({ roleCode: 'PM' })).toBe('Program Manager')
    expect(getAdminPermissionDisplayLabel({ roleCode: 'VIEWER' })).toBe('Program Viewer')
    expect(getAdminPermissionDisplayLabel({ adminLevel: 'ADMIN' })).toBe('Program Manager')
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
