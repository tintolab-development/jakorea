import { AdminEmptyNoDataIcon, AdminEmptyState } from '@jakorea/admin-ui/empty'

/** 로그 목록 GET — MASTER + HOMEPAGE_VIEW 외 403 */
export function LogListAccessDenied() {
  return (
    <div className="log-list-page">
      <AdminEmptyState
        title="조회 권한 없음"
        description="로그 목록은 최고관리자(MASTER)만 조회할 수 있습니다."
        icon={<AdminEmptyNoDataIcon />}
      />
    </div>
  )
}
