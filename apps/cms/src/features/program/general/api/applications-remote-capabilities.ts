import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

/** programs + applications 모듈 + JWT — 일반 프로그램 신청 API */
export function shouldUseGeneralApplicationsRemoteApi(): boolean {
  return (
    shouldUseGeneralProgramsRemoteApi() &&
    isRealApiModuleEnabled('applications') &&
    hasRemoteAdminJwt()
  )
}
