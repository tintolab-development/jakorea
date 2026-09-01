import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  resolveAdminRoleCodeFromUser,
  type AdminRoleCode,
} from '@/shared/lib/admin-role-policy'

export function useSessionAdminRoleCode(): AdminRoleCode | null {
  const user = useAuthStore(state => state.user)
  return resolveAdminRoleCodeFromUser(user)
}
