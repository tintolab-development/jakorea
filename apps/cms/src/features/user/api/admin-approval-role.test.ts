import { describe, expect, it } from 'vitest'
import {
  adminPermissionFeeGradeToRoleCode,
  roleCodeToAdminPermissionVariant,
} from './admin-approval-role'

describe('adminPermissionFeeGradeToRoleCode', () => {
  it('maps FE variants to BE roleCode', () => {
    expect(adminPermissionFeeGradeToRoleCode('manager')).toBe('MASTER')
    expect(adminPermissionFeeGradeToRoleCode('accounting')).toBe('ACCOUNTING_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('accounting-manager')).toBe('ACCOUNTING_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('partner')).toBe('MIDDLE')
    expect(adminPermissionFeeGradeToRoleCode('viewer')).toBe('VIEWER')
  })
})

describe('roleCodeToAdminPermissionVariant', () => {
  it('maps BE roleCode and FE variants', () => {
    expect(roleCodeToAdminPermissionVariant('MASTER')).toBe('manager')
    expect(roleCodeToAdminPermissionVariant('ACCOUNTING_MANAGER')).toBe('accounting')
    expect(roleCodeToAdminPermissionVariant('accounting-manager')).toBe('accounting')
    expect(roleCodeToAdminPermissionVariant('MIDDLE')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('PM')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('PARTNER')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('VIEWER')).toBe('viewer')
    expect(roleCodeToAdminPermissionVariant('manager')).toBe('manager')
    expect(roleCodeToAdminPermissionVariant('unknown')).toBeNull()
  })
})
