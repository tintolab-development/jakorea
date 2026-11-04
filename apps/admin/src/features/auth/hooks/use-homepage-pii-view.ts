import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasHomepagePiiView } from '@/shared/lib/homepage-pii'

export function useHomepagePiiView(): boolean {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQuery = useAdminMeProfile(adminId, isAuthenticated)
  return hasHomepagePiiView(meQuery.data?.permissions)
}
