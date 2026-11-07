import { isAxiosError } from 'axios'

function extractApiErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

export const INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE =
  'PAYMENT_STATEMENT_CONSENT_REQUIRED'

export const PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE =
  '지급조서 작성 동의를 완료한 뒤 정산을 신청할 수 있습니다.'

export const INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE: Record<string, string> = {
  SETTLEMENT_ASSIGNED_SCHEDULE_TIME_REQUIRED:
    '배정 일정 시작·종료 시간이 없어 정산을 신청할 수 없습니다.',
  SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED:
    '실적 시작·종료 시간이 없어 정산을 신청할 수 없습니다.',
  SETTLEMENT_WAGE_RATE_NOT_CONFIGURED:
    '프로그램 강사비 단가가 없어 정산을 신청할 수 없습니다.',
  LECTURE_REPORT_REQUIRED: '강의보고서/강의평가 제출 이후 정산 신청이 가능합니다.',
  LECTURE_NOT_ENDED: '강의가 종료된 이후에 지급조서를 제출할 수 있습니다.',
  ACTIVE_APPLICATION_EXISTS: '이미 제출된 지급조서가 있습니다. 재제출이 필요하면 기존 신청에서 진행해 주세요.',
  PAYMENT_STATEMENT_CONSENT_REQUIRED: PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
  ASSIGNMENT_SCHEDULE_MISMATCH: '선택한 일정이 강사 배정과 일치하지 않습니다.',
  IDEMPOTENCY_KEY_PAYLOAD_CONFLICT:
    '같은 요청을 다른 내용으로 다시 보낼 수 없습니다. 작성 화면에서 다시 시도해 주세요.',
  SETTLEMENT_APPLICATION_STATE_CONFLICT: '현재 상태에서는 지급조서를 제출할 수 없습니다.',
  SETTLEMENT_REAPPLICATION_DEADLINE_EXPIRED: '재제출 기한이 지나 지급조서를 다시 제출할 수 없습니다.',
  SETTLEMENT_REAPPLICATION_DEADLINE_UNAVAILABLE: '재제출 기한을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

export function isInstructorPaymentStatementSubmit(input: {
  applicationType?: string | null
  documentKind?: string | null
}): boolean {
  return (
    input.applicationType?.trim().toUpperCase() === 'INSTRUCTOR' &&
    input.documentKind === 'payment_statement'
  )
}

export function readInstructorSettlementErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractApiErrorCode(error.response?.data)
}

export function isPaymentStatementConsentRequiredError(error: unknown): boolean {
  return readInstructorSettlementErrorCode(error) === INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE
}

export function instructorSettlementApiErrorMessage(
  error: unknown,
  fallback = '지급조서 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
): string {
  const code = readInstructorSettlementErrorCode(error)
  if (code && INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE[code]) {
    return INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE[code]
  }
  return fallback
}
