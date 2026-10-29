import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import {
  resolveAdminGnbRoleLabel,
  type AdminMeRoleVerification,
} from '@/features/auth/lib/resolve-admin-gnb-role-label'
import { useAuthStore } from '@/features/auth/model/auth-store'

export function useAdminGnbRoleLabel(): string {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQuery = useAdminMeProfile(adminId, isAuthenticated)

  const verification: AdminMeRoleVerification = meQuery.isSuccess ? 'verified' : 'unverified'
  return resolveAdminGnbRoleLabel(meQuery.data?.roleCode, verification)
}
