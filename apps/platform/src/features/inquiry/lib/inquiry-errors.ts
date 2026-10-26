import { isAxiosError } from 'axios'

export const INQUIRY_CREATE_ERROR_FALLBACK =
  '문의 접수에 실패했습니다. 입력 내용을 확인한 뒤 잠시 후 다시 시도해 주세요.'

export const INQUIRY_DELETE_ERROR_FALLBACK =
  '문의 삭제에 실패했습니다. 답변이 완료된 문의인지 확인한 뒤 다시 시도해 주세요.'

function messageFromData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as {
    message?: unknown
    error?: { message?: unknown }
  }
  const nested = body.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
  return undefined
}

function codeFromData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as {
    code?: unknown
    error?: { code?: unknown }
  }
  if (typeof body.error?.code === 'string' && body.error.code.trim()) {
    return body.error.code.trim().toUpperCase()
  }
  if (typeof body.code === 'string' && body.code.trim()) {
    return body.code.trim().toUpperCase()
  }
  return undefined
}

export function getInquiryApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return codeFromData(error.response?.data)
}

const INQUIRY_ERROR_MESSAGES: Record<string, string> = {
  IDEMPOTENCY_KEY_CONFLICT: '변경된 요청이 이미 사용한 등록 키와 충돌했습니다. 내용을 확인한 후 다시 제출해 주세요.',
  IDEMPOTENCY_KEY_INVALID: '문의 등록 요청이 만료되었거나 올바르지 않습니다. 다시 제출해 주세요.',
  INQUIRY_ALREADY_ANSWERED: '답변이 완료된 문의는 삭제할 수 없습니다.',
  PORTAL_INQUIRY_NOT_FOUND: '문의 내역을 찾을 수 없습니다. 최신 목록을 확인해 주세요.',
  PORTAL_INQUIRY_DELETE_CONFLICT: '문의 상태가 변경되었습니다. 최신 목록을 확인해 주세요.',
}

export function getInquiryApiErrorMessage(
  error: unknown,
  fallback = INQUIRY_CREATE_ERROR_FALLBACK
): string {
  if (isAxiosError(error)) {
    const code = getInquiryApiErrorCode(error)
    return messageFromData(error.response?.data) ?? (code ? INQUIRY_ERROR_MESSAGES[code] : undefined) ?? fallback
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return fallback
}
