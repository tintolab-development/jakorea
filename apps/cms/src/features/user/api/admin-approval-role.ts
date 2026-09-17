import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

export { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
export type { AdminPermissionTagVariant }

/** 관리자 권한 UI variant → API roleCode (`changeAdminRole` / 승인). OpenAPI: MASTER · MIDDLE · VIEWER */
export function adminPermissionFeeGradeToRoleCode(feeGrade: string): string {
  switch (feeGrade.trim()) {
    case 'manager':
      return 'MASTER'
    case 'partner':
      return 'MIDDLE'
    case 'viewer':
      return 'VIEWER'
    default:
      return feeGrade.trim().toUpperCase()
  }
}
