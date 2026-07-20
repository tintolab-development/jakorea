import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * UJAT 교육 지역 — programs/ujatPrograms와 독립 opt-in.
 * VITE_REAL_API_MODULES에 `ujatEducationRegions`가 있어야 한다.
 */
export function shouldUseUjatEducationRegionsRemoteApi(): boolean {
  return hasRemoteAdminJwt() && isRealApiModuleEnabled('ujatEducationRegions')
}
