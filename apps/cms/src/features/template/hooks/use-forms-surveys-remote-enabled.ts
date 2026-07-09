import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function useFormsSurveysRemoteEnabled(enabled = true): boolean {
  return enabled && isRealApiModuleEnabled('formsSurveys') && hasRemoteAdminJwt()
}
