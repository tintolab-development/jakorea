const MASTER_LABEL = '최고관리자'
const FALLBACK_LABEL = '관리자'

/**
 * GNB 역할 라벨. `GET /api/admin/me`의 roleCode가 MASTER일 때만 최고관리자.
 * localStorage·로그인 응답의 adminLevel은 사용하지 않는다.
 */
export function formatAdminGnbRoleLabel(roleCode: string | null | undefined): string {
  if (roleCode === 'MASTER') return MASTER_LABEL
  return FALLBACK_LABEL
}
