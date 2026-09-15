import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * UJAT는 공용 programs API와 ujatPrograms 도메인 키가 모두 켜져 있어야 원격 요청한다.
 * (remote URL 구성 시 전 모듈 동일 — `isRealApiModuleEnabled`)
 */
export function shouldUseRemoteApi(): boolean {
  return (
    hasRemoteAdminJwt() &&
    isRealApiModuleEnabled('programs') &&
    isRealApiModuleEnabled('ujatPrograms')
  )
}
