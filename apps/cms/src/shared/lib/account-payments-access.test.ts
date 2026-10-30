import { describe, expect, it } from 'vitest'
import { canAccessPath } from '@/shared/config/menu-config'
import {
  canAccessAccountPayments,
  isAccountPaymentsPath,
  isAccountingManagerRoleCode,
} from './account-payments-access'

describe('isAccountingManagerRoleCode', () => {
  it('권한설정 슬러그와 ACCOUNTING_MANAGER를 인식한다', () => {
    expect(isAccountingManagerRoleCode('accounting-manager')).toBe(true)
    expect(isAccountingManagerRoleCode('accounting_manager')).toBe(true)
    expect(isAccountingManagerRoleCode('ACCOUNTING_MANAGER')).toBe(true)
    expect(isAccountingManagerRoleCode('PM')).toBe(false)
    expect(isAccountingManagerRoleCode('MASTER')).toBe(false)
  })
})

describe('isAccountPaymentsPath', () => {
  it('계좌 지급 확인 경로만 매칭한다', () => {
    expect(isAccountPaymentsPath('/settlement-management/account-payments')).toBe(true)
    expect(isAccountPaymentsPath('/settlement-management/account-payments/')).toBe(true)
    expect(isAccountPaymentsPath('/settlement-management/payment-orders')).toBe(false)
  })
})

describe('canAccessAccountPayments', () => {
  it('Master와 Accounting Manager만 허용한다', () => {
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'MASTER' })).toBe(true)
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'ACCOUNTING_MANAGER' })).toBe(true)
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'accounting-manager' })).toBe(true)
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'PM' })).toBe(false)
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'PARTNER' })).toBe(false)
    expect(canAccessAccountPayments({ role: 'ADMIN', roleCode: 'VIEWER' })).toBe(false)
    expect(canAccessAccountPayments({ role: 'INSTRUCTOR', roleCode: 'MASTER' })).toBe(false)
  })

  it('PM은 계좌 지급 경로 canAccessPath가 false라 ComingSoon보다 권한 안내를 우선한다', () => {
    expect(
      canAccessPath('/settlement-management/account-payments', {
        role: 'ADMIN',
        roleCode: 'PM',
      })
    ).toBe(false)
  })
})
