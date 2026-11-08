import { isAxiosError } from 'axios'
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
