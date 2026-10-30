import { formatAdminGnbRoleLabel } from './format-admin-gnb-role-label.ts'

/** 서버 `/api/admin/me` roleCode가 이번 세션에서 확인됐을 때만 MASTER 라벨을 허용한다. */
export type AdminMeRoleVerification = 'unverified' | 'verified'

export function resolveAdminGnbRoleLabel(
  roleCode: string | null | undefined,
  verification: AdminMeRoleVerification,
): string {
  if (verification !== 'verified') {
    return formatAdminGnbRoleLabel(undefined)
  }
  return formatAdminGnbRoleLabel(roleCode)
}
