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

/** 일반 또는 1사1교 또는 UJAT 신청 HTTP 호출 허용 (서비스 층) */
export function shouldUseApplicationsHttpRemoteApi(): boolean {
  return (
    shouldUseGeneralApplicationsRemoteApi() ||
    shouldUseCompanySchoolApplicationsRemoteApi() ||
    (isRealApiModuleEnabled('programs') &&
      isRealApiModuleEnabled('ujatPrograms') &&
      isRealApiModuleEnabled('applications') &&
      hasRemoteAdminJwt())
  )
}

/**
 * 기관·강사 신청 상세 GET · form/코멘트 hydrate.
 * 1사1교는 일반 programs remote가 꺼져 있어도 company-school opt-in이면 같은 path를 쓴다.
 */
export function shouldUseOrganizationApplicationRemoteApi(): boolean {
  return (
    shouldUseGeneralApplicationsRemoteApi() || shouldUseCompanySchoolApplicationsRemoteApi()
  )
}
