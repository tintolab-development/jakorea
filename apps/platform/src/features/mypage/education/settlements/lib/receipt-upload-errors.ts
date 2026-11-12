import {
  MemberFileTooLargeError,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import { FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE } from '@/shared/lib/file-upload-policy'
import { RECEIPT_UPLOAD_MAX_BYTES } from './receipt-upload-policy'

/** 영수증 형식 거절 문구 — 클라이언트 검사와 서버 거절(MEMBER_FILE_TYPE_NOT_ALLOWED)이 함께 쓴다. */
export const RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE = 'JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.'

/** 영수증 용량 거절 문구 — 클라이언트 검사와 서버 거절(MEMBER_FILE_SIZE_EXCEEDED)이 함께 쓴다. */
export const RECEIPT_UPLOAD_SIZE_EXCEEDED_MESSAGE = new MemberFileTooLargeError(
  RECEIPT_UPLOAD_MAX_BYTES
).message

type ErrorBody = {
  code?: unknown
  reason?: unknown
  error?: { code?: unknown; reason?: unknown }
  details?: { reason?: unknown }
}

function unwrapOriginalError(error: unknown): unknown {
  let current = error
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object' || !('originalError' in current)) break
    current = (current as { originalError?: unknown }).originalError
  }
  return current
}

function normalized(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : undefined
}

/** 서버 거절 응답의 코드와 reason을 읽는다. 응답 본문이 없으면 빈 배열. */
function readServerErrorCodes(error: unknown): string[] {
  const original = unwrapOriginalError(error)
  if (!original || typeof original !== 'object') return []
  const data = (original as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return []
  const body = data as ErrorBody
  return [
    body.error?.code,
    body.code,
    body.error?.reason,
    body.reason,
    body.details?.reason,
  ]
    .map(normalized)
    .filter((code): code is string => code != null)
}

/**
 * 영수증 업로드 서버 거절 코드를 기존 클라이언트 검사 문구로 연결한다.
 * 매핑되지 않는 코드는 null(호출부가 일반 오류 문구를 유지한다).
 */
export function resolveReceiptUploadServerErrorMessage(error: unknown): string | null {
  const codes = readServerErrorCodes(error)
  if (codes.includes('MEMBER_FILE_TYPE_NOT_ALLOWED')) return RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE
  if (codes.includes('MEMBER_FILE_SIZE_EXCEEDED')) return RECEIPT_UPLOAD_SIZE_EXCEEDED_MESSAGE
  if (codes.includes('EVIDENCE_FILE_COUNT_EXCEEDED')) return FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE
  return null
}
