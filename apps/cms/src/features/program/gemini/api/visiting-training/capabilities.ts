import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/**
 * 찾아가는 연수 create/list 시 사용할 programType (잠정).
 * OpenAPI에 GEMINI / GEMINI_TRAINING 이중 enum — BE 확정 전 handoff 가설.
 * @see programs-gemini-visiting-training-api-backend-handoff.md
 */
export const GEMINI_VISITING_TRAINING_PROGRAM_TYPE = 'GEMINI_TRAINING' as const

/** JWT + geminiVisitingTraining 모듈 */
export function shouldUseGeminiVisitingTrainingRemoteApi(): boolean {
  return hasRemoteAdminJwt() && isRealApiModuleEnabled('geminiVisitingTraining')
}
