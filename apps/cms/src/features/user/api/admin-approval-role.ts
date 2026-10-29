import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

export { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
export type { AdminPermissionTagVariant }

/** 관리자 권한 UI variant → API roleCode (`changeAdminRole` / 승인). N-16 정본 코드. */
export function adminPermissionFeeGradeToRoleCode(feeGrade: string): string {
  switch (feeGrade.trim()) {
    case 'manager':
      return 'MASTER'
    case 'accounting':
    case 'accounting-manager':
      return 'ACCOUNTING_MANAGER'
    case 'partner':
    case 'program-manager':
      return 'PROGRAM_MANAGER'
    case 'viewer':
    case 'program-viewer':
      return 'PROGRAM_VIEWER'
    default:
      return feeGrade.trim().toUpperCase().replace(/-/g, '_')
  }
}
