import type { AxiosError } from 'axios'

export const UJAT_STALE_REVISION_ALERT_MESSAGE =
  '관리자가 배정 일정을 변경했습니다. 변경된 일정을 확인 후 다시 제출해 주세요.'

const INSTITUTION_GUIDANCE_ERROR_MESSAGES: Record<string, string> = {
  GUIDANCE_ANSWERS_VALIDATION_FAILED: '입력 내용을 확인해 주세요.',
  PREFERRED_EDUCATION_DATE_INVALID:
    '선택할 수 없는 희망 교육일이 포함되어 있습니다. 화면을 새로고침한 뒤 다시 선택해 주세요.',
  ORGANIZATION_APPLICATION_NOT_OWNED: '본인 신청만 수정할 수 있습니다.',
  GUIDANCE_EDIT_NOT_ALLOWED: '현재 상태에서는 안내사항을 수정할 수 없습니다.',
  ORGANIZATION_APPLICATION_NOT_FOUND: '신청 정보를 찾을 수 없습니다.',
  APPLICATION_ANSWERS_CONFLICT:
    '신청 답변이 변경되었거나 최신 제출본이 없습니다. 새로고침 후 다시 시도해 주세요.',
  UJAT_ACTIVE_EDUCATION_SLOT_REQUIRED:
    '기관 확인에 사용할 활성 교육일·학급 배정이 없습니다. 관리자에게 확인해 주세요.',
  STALE_REVISION: UJAT_STALE_REVISION_ALERT_MESSAGE,
  UJAT_STALE_REVISION: UJAT_STALE_REVISION_ALERT_MESSAGE,
  UJAT_WORKFLOW_STATE_CONFLICT:
    '일정 확인 상태가 변경되었습니다. 신청 상세를 새로고침한 후 다시 시도해 주세요.',
  UJAT_TEMPORARY_ASSIGNMENT_REQUIRED:
    '아직 확인할 수 있는 관리자 배정 일정이 없습니다. 관리자에게 확인해 주세요.',
  INVALID_REQUEST: '요청 내용을 확인해 주세요.',
  FORBIDDEN: '안내사항을 수정할 수 없습니다.',
}

function readPortalErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { error?: { code?: string } }
  const code = record.error?.code
  return typeof code === 'string' ? code.trim() : undefined
}

function readPortalErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { message?: string; error?: { message?: string } }
  const nested = record.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  const top = record.message
  return typeof top === 'string' && top.trim() ? top.trim() : undefined
}

function readPortalErrorTraceId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { error?: { traceId?: string } }
  const traceId = record.error?.traceId
  return typeof traceId === 'string' && traceId.trim() ? traceId.trim() : undefined
}

function appendTraceId(message: string, traceId: string | undefined): string {
  if (!traceId) return message
  return `${message}\n\n(문의 시 traceId: ${traceId})`
}

export function resolveInstitutionGuidanceErrorMessage(
  error: unknown,
  fallback = '안내사항을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  const axiosError = error as AxiosError | undefined
  const data = axiosError?.response?.data
  const code = readPortalErrorCode(data)
  const serverMessage = readPortalErrorMessage(data)
  if (code === 'STALE_REVISION' || code === 'UJAT_STALE_REVISION') {
    return UJAT_STALE_REVISION_ALERT_MESSAGE
  }
  if (code === 'APPLICATION_ANSWERS_CONFLICT') {
    const base =
      serverMessage ?? INSTITUTION_GUIDANCE_ERROR_MESSAGES.APPLICATION_ANSWERS_CONFLICT
    return appendTraceId(
      `${base}\n\n잠시 후 다시 시도하거나 화면을 새로고침해 주세요.`,
      readPortalErrorTraceId(data),
    )
  }
  if (code && INSTITUTION_GUIDANCE_ERROR_MESSAGES[code]) {
    return INSTITUTION_GUIDANCE_ERROR_MESSAGES[code]
  }
  if (serverMessage) return serverMessage
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return fallback
}

export function isUjatStaleRevisionError(error: unknown): boolean {
  const axiosError = error as AxiosError | undefined
  if (axiosError?.response?.status !== 409) return false
  const code = readPortalErrorCode(axiosError.response?.data)
  return code === 'STALE_REVISION' || code === 'UJAT_STALE_REVISION'
}

export function resolveUjatTemporaryScheduleConfirmErrorMessage(
  error: unknown,
): string {
  if (isUjatStaleRevisionError(error)) return UJAT_STALE_REVISION_ALERT_MESSAGE
  return resolveInstitutionGuidanceErrorMessage(
    error,
    '관리자 배정 일정 확인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  )
}
