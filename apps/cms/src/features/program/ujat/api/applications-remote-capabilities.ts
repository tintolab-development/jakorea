/**
 * UJAT 신청·선발·정원 — remote gate (programs + ujatPrograms + applications)
 */

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'

export function shouldUseUjatApplicationsRemoteApi(): boolean {
  return (
    shouldUseUjatProgramsRemoteApi() &&
    isRealApiModuleEnabled('applications') &&
    hasRemoteAdminJwt()
  )
}
