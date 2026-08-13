import { isAxiosError } from 'axios'

export function getInstructorApplyApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 409) {
      return '이미 진행 중인 강사 신청이 있습니다. 마이페이지에서 상태를 확인해 주세요.'
    }
    if (status === 403) {
      return '강사 신청 권한이 없습니다. 로그인 상태를 확인해 주세요.'
    }

    const data = error.response?.data
    if (data && typeof data === 'object') {
      const root = data as { message?: unknown; error?: { message?: unknown; code?: unknown } }
      const nested = root.error?.message
      if (typeof nested === 'string' && nested.trim()) return nested.trim()
      if (typeof root.message === 'string' && root.message.trim()) return root.message.trim()
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim()
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
