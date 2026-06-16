export function getMemberApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '회원 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }
    if (axiosErr.response?.status === 404) {
      return '요청한 회원 정보를 찾을 수 없습니다.'
    }
    if (axiosErr.response?.status === 409) {
      const data = axiosErr.response.data
      if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as { message?: unknown }).message
        if (typeof msg === 'string' && msg.trim()) return msg.trim()
      }
      return '요청한 변경이 기존 데이터와 충돌합니다.'
    }
    const data = axiosErr.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message?: unknown }).message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}
