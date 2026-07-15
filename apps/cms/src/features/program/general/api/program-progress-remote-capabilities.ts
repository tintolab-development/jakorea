import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

/** programs + programProgress 모듈 + JWT — 일반 프로그램 진행현황 API */
export function shouldUseGeneralProgramProgressRemoteApi(): boolean {
  return (
    shouldUseGeneralProgramsRemoteApi() &&
    isRealApiModuleEnabled('programProgress') &&
    hasRemoteAdminJwt()
  )
}
