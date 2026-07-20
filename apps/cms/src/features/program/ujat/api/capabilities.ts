import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * UJAT는 공용 programs API가 켜져 있어도 별도 opt-in 없이는 원격 요청하지 않는다.
 * VITE_REAL_API_MODULES에 `programs,ujatPrograms`가 모두 있어야 한다.
 */
export function shouldUseRemoteApi(): boolean {
  return (
    hasRemoteAdminJwt() &&
    isRealApiModuleEnabled('programs') &&
    isRealApiModuleEnabled('ujatPrograms')
  )
}
