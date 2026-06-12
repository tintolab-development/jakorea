import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled, type RealApiModule } from '@/shared/config/real-api-modules'

export function useDataManagementRemoteEnabled(
  module: RealApiModule,
  enabled = true
): boolean {
  return enabled && isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}

export function shouldUseDataManagementRemote(module: RealApiModule): boolean {
  return isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}
