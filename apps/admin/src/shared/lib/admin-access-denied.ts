/**
 * 접근 권한 안내 팝업 문구 — CMS `ADMIN_ACCESS_DENIED_ALERT_*`(apps/cms/src/shared/lib/admin-role-policy.ts)와 동일.
 * 메뉴 진입 차단·403 응답 등 권한 때문에 막는 팝업은 모두 이 문구를 쓴다.
 */
export const ADMIN_ACCESS_DENIED_ALERT_TITLE = '접근 권한이 없습니다.'

export const ADMIN_ACCESS_DENIED_ALERT_CONTENT =
  '해당 화면은 권한이 있는 사용자만 이용할 수 있습니다.\n접근이 필요하신 경우 마스터 관리자에게 문의해 주세요.'

export const ADMIN_ACCESS_DENIED_ALERT = {
  title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
  content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
} as const
