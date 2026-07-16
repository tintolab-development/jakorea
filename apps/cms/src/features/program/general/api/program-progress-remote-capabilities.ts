import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseCompanySchoolProgramProgressRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

/** programs + programProgress 모듈 + JWT — 일반 프로그램 진행현황 API */
export function shouldUseGeneralProgramProgressRemoteApi(): boolean {
  return (
    shouldUseGeneralProgramsRemoteApi() &&
    isRealApiModuleEnabled('programProgress') &&
    hasRemoteAdminJwt()
  )
}

/** 일반 또는 1사1교 진행현황 HTTP 호출 허용 (서비스 층) */
export function shouldUseProgramProgressHttpRemoteApi(): boolean {
  return (
    shouldUseGeneralProgramProgressRemoteApi() ||
    shouldUseCompanySchoolProgramProgressRemoteApi()
  )
}
