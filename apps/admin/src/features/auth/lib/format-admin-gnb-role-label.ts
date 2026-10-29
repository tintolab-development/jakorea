const MASTER_LABEL = '최고관리자'
const FALLBACK_LABEL = '관리자'

/**
 * GNB 역할 라벨. 서버가 확인한 MASTER만 최고관리자로 표시한다.
 * adminLevel과 homepage admin_role.code를 동일 값으로 가정하지 않는다.
 */
export function formatAdminGnbRoleLabel(
  adminLevel: string | null | undefined,
): string {
  if (adminLevel === 'MASTER') return MASTER_LABEL
  return FALLBACK_LABEL
}
