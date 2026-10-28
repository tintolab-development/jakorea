import type { AdminLevel, User, UserRole } from '@/types/user'
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'

/** 기존 권한설정 슬러그·대문자 코드. OpenAPI AdminRoleCode 4역할에는 아직 없음. */
export function isAccountingManagerRoleCode(value?: string | null): boolean {
  const raw = (value ?? '').trim()
  if (!raw) return false
  const compact = raw.toUpperCase().replace(/[\s-]/g, '_')
  return compact === 'ACCOUNTING_MANAGER'
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
  if (isAccountingManagerRoleCode(user.roleCode)) return true
  return (
    resolveAdminRoleCodeFromUser({
      role: user.role,
      roleCode: user.roleCode as User['roleCode'],
      adminLevel: user.adminLevel,
      listMetrics: user.listMetrics,
    }) === 'MASTER'
  )
}
