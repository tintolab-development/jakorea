import {
  extractApiErrorCode,
  extractApiErrorDetails,
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'

export const INTERVIEW_NOT_ENDED_ERROR_CODE = 'INTERVIEW_NOT_ENDED'

export const INTERVIEW_RESULT_NOT_ENDED_ALERT = {
  title: '면접 결과 처리 안내',
  content:
    '면접이 아직 종료되지 않았습니다.\n면접 종료 후 담당자 평가가 완료되면 합격·불합격 처리가 가능합니다.',
} as const

export function shouldSkipLocalApiErrorAlert(error: unknown): boolean {
  return isGlobalApiErrorAlertShown(error)
}

export function readInterviewDecisionErrorAlert(
  error: unknown,
  fallbackTitle = '처리 실패'
): { title: string; content: string } {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data
  const code = extractApiErrorCode(data) ?? extractApiErrorCode(error)
  const titleFromDetails = extractApiErrorDetails(data).title?.trim()
  if (code === INTERVIEW_NOT_ENDED_ERROR_CODE) {
    return {
      title: titleFromDetails || INTERVIEW_RESULT_NOT_ENDED_ALERT.title,
      content: INTERVIEW_RESULT_NOT_ENDED_ALERT.content,
    }
  }
  return {
    title: titleFromDetails || fallbackTitle,
    content: extractApiErrorMessage(data, {
      httpStatus: getApiErrorHttpStatus(error),
      fallback: '요청 처리에 실패했습니다.',
    }),
  }
}
