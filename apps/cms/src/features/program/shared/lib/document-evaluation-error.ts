import { readApiErrorAlertMessage, getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'

export const DOCUMENT_EVALUATION_ERROR_FALLBACK = '담당자 서류 평가를 저장하지 못했습니다.'

export const DOCUMENT_EVALUATION_ERROR_ALERT_TITLE = '담당자 서류 평가 저장 실패'

/** PUT volunteer/individual `document-evaluations` — 서버 envelope 문구 우선 */
export function readDocumentEvaluationErrorMessage(error: unknown): string {
  if (getApiErrorCode(error) === 'FORBIDDEN_APPLICATION_ACTION') {
    return '해당 서류 평가 슬롯을 저장할 권한이 없습니다.'
  }
  return readApiErrorAlertMessage(error, DOCUMENT_EVALUATION_ERROR_FALLBACK)
}

export function shouldShowDocumentEvaluationErrorAlert(error: unknown): boolean {
  return !isGlobalApiErrorAlertShown(error)
}
