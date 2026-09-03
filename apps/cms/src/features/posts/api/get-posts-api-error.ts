import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

export function getPostsApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '게시글 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }
    return extractApiErrorMessage(axiosErr.response?.data, {
      httpStatus: axiosErr.response?.status,
      fallback:
        axiosErr.response?.status === 409
          ? '요청한 변경이 기존 데이터와 충돌합니다. 참조 중인 항목은 삭제할 수 없습니다.'
          : fallback,
    })
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}
