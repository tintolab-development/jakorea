import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export const COMPANY_SCHOOL_REMOTE_OPT_IN_ENV =
  'VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED' as const

export function isCompanySchoolRemoteOptedIn(): boolean {
  return String(import.meta.env.VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED)
    .trim()
    .toLowerCase() === 'true'
}

/** JWT, 공통 programs 모듈, 1사1교 별도 opt-in이 모두 충족될 때만 원격 API 사용 */
export function shouldUseCompanySchoolRemoteApi(): boolean {
  return (
    hasRemoteAdminJwt() &&
    isRealApiModuleEnabled('programs') &&
    isCompanySchoolRemoteOptedIn()
  )
}
