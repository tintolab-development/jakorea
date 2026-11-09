import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessHomepageLogs } from '@/shared/lib/homepage-log-access'

/** 로그 관리 진입 가능 여부. 본인 정보 조회 전(`resolved=false`)에는 판정하지 않는다. */
export function useHomepageLogAccess(): { resolved: boolean; allowed: boolean } {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQuery = useAdminMeProfile(adminId, isAuthenticated)
  return {
    resolved: meQuery.isSuccess,
    allowed:
      meQuery.isSuccess && canAccessHomepageLogs(meQuery.data?.roleCode, meQuery.data?.permissions),
  }
}
