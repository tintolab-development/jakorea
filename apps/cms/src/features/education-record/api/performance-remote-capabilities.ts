import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'

export function isPerformanceRecordsRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('performanceRecords')
}

export function shouldUsePerformanceRecordsRemoteApi(): boolean {
  return isPerformanceRecordsRemoteEnabled() && hasRemoteAdminJwt()
}

/** remote 모드에서 목록 API가 서버 필터를 지원하지 않는 UI 필터 안내 */
export function getPerformanceRemoteFilterNotice(remoteEnabled: boolean): string | null {
  if (!remoteEnabled) return null
  return '실 API 목록은 최대 200건까지 조회되며, 필터는 해당 범위 내에서 적용됩니다.'
}
