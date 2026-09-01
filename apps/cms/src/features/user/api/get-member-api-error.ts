import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

export function getMemberApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '회원 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }
    const extracted = extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback,
    })
    if (extracted) return extracted
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}
