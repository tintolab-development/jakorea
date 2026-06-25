import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function useNotificationsRemoteEnabled(enabled = true): boolean {
  return enabled && isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}
