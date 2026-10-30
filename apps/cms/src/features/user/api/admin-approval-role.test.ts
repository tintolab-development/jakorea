import { describe, expect, it } from 'vitest'
import {
  ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE,
  adminPermissionFeeGradeToRoleCode,
  roleCodeToAdminPermissionVariant,
} from './admin-approval-role'

describe('adminPermissionFeeGradeToRoleCode', () => {
  it('maps FE variants to BE roleCode', () => {
    expect(adminPermissionFeeGradeToRoleCode('manager')).toBe('MASTER')
    expect(adminPermissionFeeGradeToRoleCode('accounting')).toBe('ACCOUNTING_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('accounting-manager')).toBe('ACCOUNTING_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('partner')).toBe('PROGRAM_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('program-manager')).toBe('PROGRAM_MANAGER')
    expect(adminPermissionFeeGradeToRoleCode('viewer')).toBe('PROGRAM_VIEWER')
    expect(adminPermissionFeeGradeToRoleCode('program-viewer')).toBe('PROGRAM_VIEWER')
  })

  it('rejects legacy role codes on the write path', () => {
    expect(() => adminPermissionFeeGradeToRoleCode('PM')).toThrow(/지원하지 않는 관리자 권한 코드/)
    expect(() => adminPermissionFeeGradeToRoleCode('PARTNER')).toThrow(/지원하지 않는 관리자 권한 코드/)
    expect(() => adminPermissionFeeGradeToRoleCode('MIDDLE')).toThrow(/지원하지 않는 관리자 권한 코드/)
    expect(() => adminPermissionFeeGradeToRoleCode('VIEWER')).toThrow(/지원하지 않는 관리자 권한 코드/)
    expect(adminPermissionFeeGradeToRoleCode('MASTER')).toBe('MASTER')
  })

  it('rejects unknown global role writes', () => {
    expect(() => adminPermissionFeeGradeToRoleCode('UNKNOWN_ROLE')).toThrow(
      /지원하지 않는 관리자 권한 코드/
    )
  })

  it('does not default admin create to legacy VIEWER', () => {
    expect(ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE).toBe('PROGRAM_VIEWER')
    expect(ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE).not.toBe('VIEWER')
    expect(ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE).not.toBe('PM')
    expect(ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE).not.toBe('PARTNER')
  })
})

describe('roleCodeToAdminPermissionVariant', () => {
  it('maps BE roleCode and FE variants', () => {
    expect(roleCodeToAdminPermissionVariant('MASTER')).toBe('manager')
    expect(roleCodeToAdminPermissionVariant('ACCOUNTING_MANAGER')).toBe('accounting')
    expect(roleCodeToAdminPermissionVariant('accounting-manager')).toBe('accounting')
    expect(roleCodeToAdminPermissionVariant('PROGRAM_MANAGER')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('MIDDLE')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('PM')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('PARTNER')).toBe('partner')
    expect(roleCodeToAdminPermissionVariant('PROGRAM_VIEWER')).toBe('viewer')
    expect(roleCodeToAdminPermissionVariant('VIEWER')).toBe('viewer')
    expect(roleCodeToAdminPermissionVariant('manager')).toBe('manager')
    expect(roleCodeToAdminPermissionVariant('unknown')).toBeNull()
  })
})
