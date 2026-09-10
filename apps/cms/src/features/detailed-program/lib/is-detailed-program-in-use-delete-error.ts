import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const DETAILED_PROGRAM_IN_USE_CODE = 'DETAILED_PROGRAM_IN_USE'

/** bulk-delete 200+failures / HTTP 409 / envelope code — 실적 사용 중 삭제 불가 */
export function isDetailedProgramInUseDeleteError(error: unknown): boolean {
  if (error instanceof Error && error.message.includes(DETAILED_PROGRAM_IN_USE_CODE)) {
    return true
  }
  if (!error || typeof error !== 'object') return false
  const axiosErr = error as { response?: { status?: number; data?: unknown } }
  if (axiosErr.response?.status === 409) return true
  return extractApiErrorCode(axiosErr.response?.data) === DETAILED_PROGRAM_IN_USE_CODE
}
