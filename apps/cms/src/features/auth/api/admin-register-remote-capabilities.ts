import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function isAdminRegisterRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('adminAuth')
}
