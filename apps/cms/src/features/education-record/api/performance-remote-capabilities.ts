import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'

export function isPerformanceRecordsRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('performanceRecords')
}

export function shouldUsePerformanceRecordsRemoteApi(): boolean {
  return isPerformanceRecordsRemoteEnabled() && hasRemoteAdminJwt()
}
