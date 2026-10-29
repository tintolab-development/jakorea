import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

export { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
export type { AdminPermissionTagVariant }

const CANONICAL_WRITE_ROLE_CODES = new Set([
  'MASTER',
  'ACCOUNTING_MANAGER',
  'PROGRAM_MANAGER',
  'PROGRAM_VIEWER',
])

/** 관리자 신규 등록 기본 권한 — 레거시 VIEWER가 아니라 N-16 PROGRAM_VIEWER */
export const ADMIN_ACCOUNT_CREATE_DEFAULT_ROLE_CODE = 'PROGRAM_VIEWER'

/** 관리자 권한 UI variant → API roleCode (`changeAdminRole` / 승인). N-16 정본만. */
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
    default: {
      const upper = feeGrade.trim().toUpperCase().replace(/-/g, '_')
      if (upper === 'PM' || upper === 'PARTNER' || upper === 'MIDDLE') {
        return 'PROGRAM_MANAGER'
      }
      if (upper === 'VIEWER') {
        return 'PROGRAM_VIEWER'
      }
      if (CANONICAL_WRITE_ROLE_CODES.has(upper)) {
        return upper
      }
      throw new Error(`지원하지 않는 관리자 권한 코드입니다: ${feeGrade}`)
    }
  }
}
