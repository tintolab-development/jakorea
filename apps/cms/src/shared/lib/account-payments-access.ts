import type { AdminLevel, User, UserRole } from '@/types/user'
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import {
  isCmsAccountPaymentsAdminRole,
  resolveCmsGlobalAdminRole,
} from '@/shared/lib/cms-global-role-code'

/** 전역 역할 Accounting Manager 여부(레거시 슬러그·별칭 포함). 판정은 `resolveCmsGlobalAdminRole` 기준. */
export function isAccountingManagerRoleCode(value?: string | null): boolean {
  return resolveCmsGlobalAdminRole(value) === 'ACCOUNTING_MANAGER'
}

export function isAccountPaymentsPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return (
    normalized === '/settlement-management/account-payments' ||
    normalized.startsWith('/settlement-management/account-payments/')
  )
}

export type AccountPaymentsAccessUser = {
  role?: UserRole | null
  roleCode?: string | null
  adminLevel?: AdminLevel
  listMetrics?: User['listMetrics']
} | null | undefined

/**
 * 계좌 지급 현황 상세·지급 완료 처리: Master 또는 Accounting Manager만.
 * BE 역할 코드 보고가 없어 AdminRoleCode union은 바꾸지 않고 원문 roleCode만 본다.
 */
export function canAccessAccountPayments(user: AccountPaymentsAccessUser): boolean {
  if (!user || user.role !== 'ADMIN') return false
  // 전역 역할 공통 판정(roleCode → listMetrics → adminLevel 순)과 같은 기준으로 본다.
  return isCmsAccountPaymentsAdminRole(
    resolveAdminRoleCodeFromUser({
      role: user.role,
      roleCode: user.roleCode as User['roleCode'],
      adminLevel: user.adminLevel,
      listMetrics: user.listMetrics,
    })
  )
}
