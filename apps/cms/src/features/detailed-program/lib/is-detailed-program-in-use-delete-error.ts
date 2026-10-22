import { extractApiErrorCode, getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { isDetailedProgramConcurrentModificationError } from './api-errors'

export const DETAILED_PROGRAM_IN_USE_CODE = 'DETAILED_PROGRAM_IN_USE'

/** bulk-delete 200+failures / HTTP 409 / envelope code — 실적 사용 중 삭제 불가 */
export function isDetailedProgramInUseDeleteError(error: unknown): boolean {
  if (isDetailedProgramConcurrentModificationError(error)) return false
  if (error instanceof Error && error.message.includes(DETAILED_PROGRAM_IN_USE_CODE)) {
    return true
  }
  if (!error || typeof error !== 'object') return false
  const axiosErr = error as { response?: { status?: number; data?: unknown } }
  if (getApiErrorCode(error) === DETAILED_PROGRAM_IN_USE_CODE) return true
  if (extractApiErrorCode(axiosErr.response?.data) === DETAILED_PROGRAM_IN_USE_CODE) return true
  return axiosErr.response?.status === 409
}
