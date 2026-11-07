import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'

export type GeminiOrganizationApplicationApproveTiming =
  | 'IMMEDIATE'
  | 'SCHEDULED'
  | 'ON_ANNOUNCEMENT'

export type GeminiOrganizationApplicationApprovePayload = {
  timing?: GeminiOrganizationApplicationApproveTiming
  scheduledAt?: string
}

export type GeminiOrganizationApplicationApproveBody = {
  timing?: GeminiOrganizationApplicationApproveTiming
  scheduledAt?: string
}

/** OpenAPI: GeminiOrganizationBulkApproveRequest — bulk-approve 전용 (ON_ANNOUNCEMENT 없음) */
export type GeminiOrganizationBulkApproveRequest = {
  ids: number[]
  timing?: 'IMMEDIATE' | 'SCHEDULED' | null
  scheduledAt?: string | null
}

export function toGeminiOrganizationBulkApproveBody(
  ids: number[],
  payload?: GeminiOrganizationApplicationApprovePayload
): GeminiOrganizationBulkApproveRequest {
  const timing = payload?.timing ?? 'IMMEDIATE'
  if (timing === 'SCHEDULED') {
    const scheduledAt = payload?.scheduledAt?.trim()
    return scheduledAt
      ? { ids, timing: 'SCHEDULED', scheduledAt }
      : { ids, timing: 'SCHEDULED' }
  }
  return { ids }
}

export const GEMINI_APPLICATION_DECISION_CONFLICT_MESSAGE =
  '현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.'

/**
 * Gemini 기관 단건 승인 body.
 * preferredScheduleRank / selectedScheduleId / requestedScheduleId / slots 는 보내지 않는다.
 * UI 「직접 설정」은 wire timing SCHEDULED. DIRECT 는 쓰지 않는다.
 */
export function toGeminiOrganizationApplicationApproveBody(
  payload?: GeminiOrganizationApplicationApprovePayload
): GeminiOrganizationApplicationApproveBody {
  const timing = payload?.timing ?? 'IMMEDIATE'
  if (timing === 'SCHEDULED') {
    const scheduledAt = payload?.scheduledAt?.trim()
    return scheduledAt
      ? { timing: 'SCHEDULED', scheduledAt }
      : { timing: 'SCHEDULED' }
  }
  if (timing === 'ON_ANNOUNCEMENT') {
    return { timing: 'ON_ANNOUNCEMENT' }
  }
  return {}
}

export function formatGeminiOrganizationApplicationDecisionError(
  error: unknown
): string | null {
  const notifyMessage = getNotificationTimingApiErrorMessage(error)
  if (notifyMessage) return notifyMessage

  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  const code = extractApiErrorCode(data)
  if (!code) return null

  if (code === 'APPLICATION_DECISION_CONFLICT') {
    return extractApiErrorMessage(data, {
      httpStatus: getApiErrorHttpStatus(error),
      fallback: GEMINI_APPLICATION_DECISION_CONFLICT_MESSAGE,
    })
  }
  if (code === 'GEMINI_MINIMUM_PARTICIPANTS_NOT_MET') {
    return extractApiErrorMessage(data, {
      httpStatus: getApiErrorHttpStatus(error),
      fallback: '최소 참여 인원을 충족하지 않아 승인할 수 없습니다.',
    })
  }
  return null
}
