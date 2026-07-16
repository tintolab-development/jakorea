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

/** 1사1교 프로그램 + 신청(applications) 모듈 */
export function shouldUseCompanySchoolApplicationsRemoteApi(): boolean {
  return (
    shouldUseCompanySchoolRemoteApi() &&
    isRealApiModuleEnabled('applications') &&
    hasRemoteAdminJwt()
  )
}

/** 1사1교 프로그램 + 진행현황(programProgress) 모듈 */
export function shouldUseCompanySchoolProgramProgressRemoteApi(): boolean {
  return (
    shouldUseCompanySchoolRemoteApi() &&
    isRealApiModuleEnabled('programProgress') &&
    hasRemoteAdminJwt()
  )
}

/** posts / surveys / navigation — programs 코어 gate와 동일 */
export function shouldUseCompanySchoolProgramsReadsRemoteApi(): boolean {
  return shouldUseCompanySchoolRemoteApi()
}
