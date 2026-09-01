import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

/** programs + applications 모듈 + JWT — 일반 프로그램 신청 API */
export function shouldUseGeneralApplicationsRemoteApi(): boolean {
  return (
    shouldUseGeneralProgramsRemoteApi() &&
    isRealApiModuleEnabled('applications') &&
    hasRemoteAdminJwt()
  )
}

/** 일반 또는 1사1교 신청 HTTP 호출 허용 (서비스 층) */
export function shouldUseApplicationsHttpRemoteApi(): boolean {
  return (
    shouldUseGeneralApplicationsRemoteApi() || shouldUseCompanySchoolApplicationsRemoteApi()
  )
}
