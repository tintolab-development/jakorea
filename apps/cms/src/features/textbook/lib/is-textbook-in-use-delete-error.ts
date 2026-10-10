import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const TEXTBOOK_IN_USE_CODE = 'TEXTBOOK_IN_USE'

export function isTextbookInUseDeleteError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (extractApiErrorCode(axiosErr.response?.data) === TEXTBOOK_IN_USE_CODE) {
      return true
    }
    return axiosErr.response?.status === 409
  }
  return false
}

export const TEXTBOOK_DELETE_BLOCKED_REASON =
  '프로그램에서 사용 중인 교재는 삭제할 수 없습니다.'
