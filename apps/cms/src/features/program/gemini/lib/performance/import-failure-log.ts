import { isAxiosError, type AxiosError } from 'axios'
import type { ApiErrorEnvelope } from '@/shared/lib/extract-api-error-message'
import { GeminiImportPreviewFailureError } from './import-preview-failure'

export type GeminiImportFailureLog = {
  kind: 'ROW_FAILURE' | 'HTTP' | 'UNKNOWN'
  message: string
  previewFailureKind?: string
  status?: number
  code?: string
  field?: string
  traceId?: string
}

/**
 * 업로드 실패 팝업은 시안 문구로 통일되므로, 원인 추적용 요약을 따로 만든다.
 * 행 원문·연락처 같은 개인정보가 섞일 수 있는 요청 본문·details 값은 담지 않는다.
 */
export function summarizeGeminiImportFailure(error: unknown): GeminiImportFailureLog {
  if (error instanceof GeminiImportPreviewFailureError) {
    return { kind: 'ROW_FAILURE', previewFailureKind: error.kind, message: error.message }
  }
  if (isAxiosError<ApiErrorEnvelope>(error)) {
    const body = error.response?.data
    return {
      kind: 'HTTP',
      message: body?.error?.message ?? body?.message ?? error.message,
      status: error.response?.status,
      code: body?.error?.code ?? error.code,
      field: body?.error?.field ?? undefined,
      traceId: body?.error?.traceId ?? body?.traceId,
    }
  }
  return {
    kind: 'UNKNOWN',
    message: error instanceof Error ? error.message : String(error),
  }
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 429])

/**
 * 서버·네트워크 문제로 업로드가 실패했는지 판정한다(기능정의 0837).
 * 응답이 없거나(네트워크) 5xx·408·429이면 파일 문제가 아니므로 양식 불일치로 안내하지 않는다.
 */
export function isGeminiImportTransientFailure(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  if (status == null) return true
  return status >= 500 || TRANSIENT_HTTP_STATUSES.has(status)
}

/** 로그인·권한 오류는 업로드 실패가 아니라 공통 안내(로그인 만료·권한 없음)로 처리한다. */
export function isGeminiImportAuthFailure(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status === 401 || status === 403
}
