import { useAuthStore } from '@/features/auth/model/auth-store'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import { isCmsViewerAdminRole } from '@/shared/lib/cms-global-role-code'

/**
 * 권한 설정 V1.2 — Program Viewer는 조회만 가능하다. 쓰기 버튼(알림 재발송 등)은 숨기지 않고,
 * 누르면 접근 불가 안내를 띄운다. 막았으면 true — 호출부는 바로 return 한다.
 * 클릭 시점에 세션 역할을 읽어 렌더 함수·컴포넌트 어디서나 쓸 수 있다.
 */
export function blockViewerWriteAction(): boolean {
  if (!isCmsViewerAdminRole(useAuthStore.getState().user?.roleCode)) return false
  showAdminAccessDeniedAlert()
  return true
}
