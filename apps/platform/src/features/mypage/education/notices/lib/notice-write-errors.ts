import type { AxiosError } from 'axios'

const NOTICE_WRITE_ERROR_MESSAGES: Record<string, string> = {
  PARTICIPATION_REQUIRED: '선정된 참여자만 안내사항을 등록할 수 있습니다.',
  NOTICE_WRITE_NOT_ALLOWED: '진행 중인 프로그램에서만 안내사항을 등록할 수 있습니다.',
  INVALID_REQUEST: '입력값을 확인해 주세요. (본문·공개 범위·기관 정보)',
  INVALID_IDENTIFIER: '신청 정보가 올바르지 않습니다.',
  NOTICE_NOT_OWNED: '본인이 작성한 안내사항만 수정할 수 있습니다.',
}

function readPortalErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { error?: { code?: string } }
  const code = record.error?.code
  return typeof code === 'string' ? code.trim() : undefined
}

export function resolvePortalNoticeWriteErrorMessage(
  error: unknown,
  fallback = '안내사항을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  const axiosError = error as AxiosError<unknown>
  const code = readPortalErrorCode(axiosError.response?.data)
  if (code && NOTICE_WRITE_ERROR_MESSAGES[code]) {
    return NOTICE_WRITE_ERROR_MESSAGES[code]
  }
  return fallback
}
