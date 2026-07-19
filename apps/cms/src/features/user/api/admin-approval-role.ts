import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

/** 관리자 권한 UI variant → API roleCode (`changeAdminRole` / 승인) */
export function adminPermissionFeeGradeToRoleCode(feeGrade: string): string {
  switch (feeGrade.trim()) {
    case 'manager':
      return 'MASTER'
    case 'partner':
      return 'PARTNER'
    case 'viewer':
      return 'VIEWER'
    default:
      return feeGrade.trim().toUpperCase()
  }
}

/**
 * API roleCode / listMetrics 문자열 → UI variant
 * MASTER·PM·PARTNER·VIEWER 및 FE variant(manager/partner/viewer) 모두 수용
 */
export function roleCodeToAdminPermissionVariant(
  roleCode?: string
): AdminPermissionTagVariant | null {
  const raw = (roleCode ?? '').trim()
  if (!raw) return null
  const upper = raw.toUpperCase()
  if (upper === 'MASTER' || raw === 'manager') return 'manager'
  if (upper === 'PM' || upper === 'PARTNER' || raw === 'partner') return 'partner'
  if (upper === 'VIEWER' || raw === 'viewer') return 'viewer'
  return null
}
