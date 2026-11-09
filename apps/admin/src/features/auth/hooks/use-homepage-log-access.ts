import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessHomepageLogs } from '@/shared/lib/homepage-log-access'

/**
 * 로그 관리(Master 전용) 진입 판정.
 * - `pending`: 본인 정보 조회 중 — 로그 화면을 그리지 않고 기다린다.
 * - `denied`: Master가 아니거나 본인 정보 조회 실패 — 접근 불가 안내.
 *   조회 실패를 통과시키면 화면이 열린 뒤 로그 API 403으로 화면 안 안내가 떠서 동작이 갈린다.
 */
export type HomepageLogAccessStatus = 'pending' | 'allowed' | 'denied'

export function useHomepageLogAccess(): {
  status: HomepageLogAccessStatus
  resolved: boolean
  allowed: boolean
} {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQuery = useAdminMeProfile(adminId, isAuthenticated)
  let status: HomepageLogAccessStatus = 'pending'
  if (meQuery.isSuccess) {
    status = canAccessHomepageLogs(meQuery.data?.roleCode, meQuery.data?.permissions)
      ? 'allowed'
      : 'denied'
  } else if (meQuery.isError || !isAuthenticated || !adminId) {
    status = 'denied'
  }
  return { status, resolved: status !== 'pending', allowed: status === 'allowed' }
}
