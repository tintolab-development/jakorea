import { isAxiosError } from 'axios'

function readEnvelopeMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const root = data as { message?: unknown; error?: { message?: unknown } }
  const nested = root.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof root.message === 'string' && root.message.trim()) return root.message.trim()
  return undefined
}

export function getInstructorApplyApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const envelope = readEnvelopeMessage(error.response?.data)
    if (envelope) return envelope

    const status = error.response?.status
    if (status === 409) {
      return '이미 진행 중인 강사 신청이 있습니다. 마이페이지에서 상태를 확인해 주세요.'
    }
    if (status === 403) {
      return '강사 신청 권한이 없습니다. 로그인 상태를 확인해 주세요.'
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
