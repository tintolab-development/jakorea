import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * UJAT 교육 지역 — programs/ujatPrograms와 독립 도메인 키.
 * remote URL 구성 시 `isRealApiModuleEnabled('ujatEducationRegions')`로 켠다.
 */
export function shouldUseUjatEducationRegionsRemoteApi(): boolean {
  return hasRemoteAdminJwt() && isRealApiModuleEnabled('ujatEducationRegions')
}
