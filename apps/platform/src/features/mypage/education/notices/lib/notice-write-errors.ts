import type { AxiosError } from 'axios'

const NOTICE_WRITE_ERROR_MESSAGES: Record<string, string> = {
  NOTICE_NOT_FOUND: '안내사항을 찾을 수 없습니다.',
  PARTICIPATION_REQUIRED: '선정된 참여자만 안내사항을 등록할 수 있습니다.',
  NOTICE_WRITE_NOT_ALLOWED: '진행 중인 프로그램에서만 안내사항을 등록할 수 있습니다.',
  INVALID_REQUEST: '입력값을 확인해 주세요. (본문·공개 범위·기관 정보)',
  INVALID_IDENTIFIER: '신청 정보가 올바르지 않습니다.',
  NOTICE_NOT_OWNED: '본인이 작성한 안내사항만 수정할 수 있습니다.',
  INLINE_IMAGE_FILE_PURPOSE_MISMATCH: '본문 이미지 용도가 올바르지 않습니다.',
  INLINE_IMAGE_FILE_OWNER_MISMATCH: '본인이 업로드한 본문 이미지만 사용할 수 있습니다.',
  INLINE_IMAGE_FILE_NOT_AVAILABLE: '본문 이미지 보안 검사가 아직 끝나지 않았습니다.',
  INLINE_IMAGE_FILE_NOT_FOUND: '본문 이미지를 찾을 수 없습니다.',
  INLINE_IMAGE_CONTENT_TYPE_REQUIRED: '이미지 파일 형식을 확인해 주세요.',
  INLINE_IMAGE_DUPLICATED: '같은 본문 이미지는 한 번만 사용할 수 있습니다.',
  INLINE_IMAGE_FILE_ID_REQUIRED: '본문 이미지 파일을 다시 선택해 주세요.',
  INLINE_IMAGE_DATA_URI_NOT_ALLOWED: '본문 이미지 파일을 다시 업로드해 주세요.',
  UNSAFE_RICH_TEXT_CONTENT: '본문에 허용되지 않는 내용이 포함되어 있습니다.',
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
