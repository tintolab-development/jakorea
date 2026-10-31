import {
  programEditWindowErrorMessage,
  resolveProgramRecruitmentPolicyErrorMessage,
} from '@/shared/lib/program-edit-window-error-message'

/** 백엔드 공통 에러 envelope (`success: false`, RFC7807식 `detail` 포함) */
export type ApiErrorEnvelope = {
  success?: boolean
  message?: string
  /** RFC7807 / ApiResponse 업무 문구. `message`와 같다. */
  detail?: string
  error?: {
    code?: string
    message?: string
    detail?: string
    field?: string | null
    traceId?: string
    /** 키가 없을 수 있음 — 서버는 빈 값을 null 대신 생략한다. */
    details?: Record<string, string | undefined> | null
  }
  traceId?: string
}

const PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES: Record<string, string> = {
  PROGRAM_EDUCATION_STRUCTURE_RESET_REQUIRED:
    '교육구조를 변경하려면 이전 교육구조의 회차 또는 일정 정보를 비워야 합니다.',
  PROGRAM_EDUCATION_STRUCTURE_PAYLOAD_REQUIRED:
    '변경할 교육구조의 회차 또는 일정 정보를 입력해 주세요.',
  PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED:
    '이미 신청·배정 또는 교육 운영 이력이 있는 프로그램은 교육구조를 변경할 수 없습니다.',
  PROGRAM_EDUCATION_STRUCTURE_CHANGE_CONCURRENT:
    '다른 관리자가 프로그램 정보를 변경했습니다. 최신 정보를 확인한 후 다시 시도해 주세요.',
  GENERAL_CURRICULUM_SESSION_IN_USE:
    '설문에 연결된 교육 회차가 있어 교육구조를 변경할 수 없습니다.',
}

import {
  UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE,
  UJAT_REVISION_REQUEST_DUPLICATE_MESSAGE,
} from '@/features/program/ujat/lib/ujat-institution-approval-workflow'

const UJAT_INSTITUTION_WORKFLOW_ERROR_MESSAGES: Record<string, string> = {
  UJAT_INSTITUTION_CONFIRMATION_REQUIRED: '기관 확인이 완료되기 전에는 승인할 수 없습니다.',
  UJAT_TEMPORARY_SLOT_REQUIRED: '일정과 학급을 먼저 입력해 주세요.',
  UJAT_REGION_CLASS_CAPACITY_EXCEEDED:
    '선택한 지역·반기의 잔여 학급 정원을 초과했습니다. 지역 또는 일정을 변경해 주세요.',
  UJAT_TEMPORARY_ASSIGNMENT_REQUIRED: '임시 일정을 먼저 배정한 뒤 기관 확인을 진행해 주세요.',
  UJAT_EDUCATION_DAY_SCHEDULE_REQUIRED:
    '연간 기간 일정이 아니라 해당 금요일 하루 일정으로 저장해 주세요.',
  UJAT_EDUCATION_SLOT_NOT_IN_APPLICATION_CLASS_CATALOG:
    '신청한 학년·반 범위 밖의 학급입니다. classCount 기준으로 반을 선택해 주세요.',
  STALE_REVISION: '기관이 확인한 일정은 그대로 저장하지 않았습니다. 변경된 기관만 다시 확인해 주세요.',
  UJAT_ASSIGNMENT_LOCKED: '기관이 확인한 일정은 수정할 수 없습니다. 수정 요청 후 다시 배정하세요.',
}

function resolveUjatInstitutionWorkflowErrorMessage(
  code: string,
  field?: string
): string | undefined {
  if (code === 'UJAT_WORKFLOW_STATE_CONFLICT') {
    if (field === 'status') {
      return UJAT_REVISION_REQUEST_DUPLICATE_MESSAGE
    }
    return UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE
  }
  return UJAT_INSTITUTION_WORKFLOW_ERROR_MESSAGES[code]
}

const UJAT_P0_ERROR_MESSAGES: Record<string, string> = {
  UJAT_ACTIVITY_CERTIFICATE_ADMIN_ONLY: 'UJAT 활동인증서는 관리자만 발급할 수 있습니다.',
  UJAT_ORGANIZATION_ALREADY_APPLIED: '같은 UJAT 프로그램에 이미 신청한 학교입니다.',
  UJAT_INTERVIEW_SCORE_INVALID: 'UJAT 면접 점수는 평가자별 1~5점 정수만 입력할 수 있습니다.',
  UJAT_VOLUNTEER_INTERVIEW_REQUIRED: 'UJAT 봉사자 모집은 면접이 필수입니다. 면접 기간을 입력해 주세요.',
}

function asEnvelope(data: unknown): ApiErrorEnvelope | null {
  if (!data || typeof data !== 'object') return null
  return data as ApiErrorEnvelope
}

function trimText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/**
 * 성공이 아닌 응답 문구: body.detail → error.detail → error.message → body.message.
 * 상태코드 고정 문구보다 서버 업무 문구를 우선한다.
 */
export function readApiErrorEnvelopeText(data: unknown): string | undefined {
  const envelope = asEnvelope(data)
  if (!envelope) {
    if (typeof data === 'string' && data.trim()) return data.trim()
    return undefined
  }
  return (
    trimText(envelope.detail) ||
    trimText(envelope.error?.detail) ||
    trimText(envelope.error?.message) ||
    trimText(envelope.message)
  )
}

/**
 * Axios `response.data` 등 백엔드 에러 body에서 사용자 표시용 메시지를 추출합니다.
 * 서버가 내려준 문자열을 **가공하지 않고** 그대로 사용합니다.
 */
export function extractApiErrorMessage(
  data: unknown,
  options?: { httpStatus?: number | null; fallback?: string }
): string {
  const code = extractApiErrorCode(data)
  const field = extractApiErrorField(data)
  const ujatWorkflowMessage = code ? resolveUjatInstitutionWorkflowErrorMessage(code, field) : undefined
  if (ujatWorkflowMessage) {
    return ujatWorkflowMessage
  }
  if (code && UJAT_INSTITUTION_WORKFLOW_ERROR_MESSAGES[code]) {
    return UJAT_INSTITUTION_WORKFLOW_ERROR_MESSAGES[code]
  }
  if (code && PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES[code]) {
    return PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES[code]
  }
  const envelope = asEnvelope(data)
  const serverMessage = readApiErrorEnvelopeText(data)
  const policyMessage = resolveProgramRecruitmentPolicyErrorMessage(code, serverMessage)
  if (policyMessage) return policyMessage

  const mapped = programEditWindowErrorMessage(code)
  if (mapped) return mapped

  const ujatMapped = code ? UJAT_P0_ERROR_MESSAGES[code] : undefined
  if (ujatMapped && (!serverMessage || serverMessage === code)) {
    return ujatMapped
  }

  if (serverMessage && !(ujatMapped && serverMessage === code)) {
    return serverMessage
  }
  if (ujatMapped) return ujatMapped

  const nestedCode = envelope?.error?.code?.trim()
  if (nestedCode) return nestedCode

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  const status = options?.httpStatus
  if (status === 403) return '요청에 필요한 권한이 없습니다.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 409) return '요청한 변경이 기존 데이터와 충돌합니다.'
  if (status != null && status >= 500) return '서버 처리 중 오류가 발생했습니다.'

  return options?.fallback?.trim() || '요청 처리에 실패했습니다.'
}

/** Alert 본문 — 서버 메시지 그대로 (traceId 미포함) */
export function formatApiErrorAlertContent(data: unknown, options?: { httpStatus?: number | null }): string {
  return extractApiErrorMessage(data, options)
}

/** 구조화 오류 코드 (`error.code` 또는 top-level `code`) */
/** `error.field`. 없으면 undefined. */
export function extractApiErrorField(data: unknown): string | undefined {
  const envelope = asEnvelope(data)
  const field = envelope?.error?.field
  return typeof field === 'string' && field.trim() ? field.trim() : undefined
}

export function getApiErrorField(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorField(data)
}

export function extractApiErrorCode(data: unknown): string | undefined {
  const envelope = asEnvelope(data)
  const nested = envelope?.error?.code?.trim()
  if (nested) return nested
  const top = (envelope as { code?: unknown } | null)?.code
  return typeof top === 'string' && top.trim() ? top.trim() : undefined
}

/** `error.details` 중 문자열 값만. 없으면 빈 객체. */
export function extractApiErrorDetails(data: unknown): Record<string, string | undefined> {
  const details = asEnvelope(data)?.error?.details
  if (!details || typeof details !== 'object') return {}
  const out: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export function getApiErrorHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const status = (error as { response?: { status?: number } }).response?.status
  return typeof status === 'number' ? status : undefined
}

/** 409 또는 UJAT workflow status conflict — 재시도 없이 모달을 닫는다. */
export function isApiWorkflowConflictError(error: unknown): boolean {
  if (getApiErrorHttpStatus(error) === 409) return true
  return getApiErrorCode(error) === 'UJAT_WORKFLOW_STATE_CONFLICT'
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorCode(data)
}

/** Axios 오류의 envelope을 사용자 안내로 바꾼다. 응답 body가 없으면 fallback. */
export function readApiErrorAlertMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response
    if (response && 'data' in response) {
      return extractApiErrorMessage(response.data, {
        httpStatus: response.status,
        fallback,
      })
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
