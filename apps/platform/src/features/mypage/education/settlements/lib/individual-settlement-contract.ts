import { isAxiosError } from 'axios'

function extractApiErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

/** Portal `program_individual_application` — 일반 개인 참가 신청 유형만. */
export function isIndividualScheduleSettlementAudience(
  applicationType: string | null | undefined,
): boolean {
  return applicationType?.trim().toUpperCase() === 'INDIVIDUAL'
}

export function isGeneralIndividualProgramType(programType: string | null | undefined): boolean {
  return programType?.trim().toUpperCase() === 'GENERAL_INDIVIDUAL'
}

/**
 * GET individual-settlements/applications/{id}/schedules 호출 여부.
 * `id`는 `program_individual_application.id`만 허용 — 강사·기관 신청 id 금지.
 */
export function shouldUseIndividualSettlementSchedulesApi(
  applicationType: string | null | undefined,
  programType?: string | null,
): boolean {
  if (!isIndividualScheduleSettlementAudience(applicationType)) return false
  const normalizedProgramType = programType?.trim()
  if (!normalizedProgramType) return true
  return isGeneralIndividualProgramType(normalizedProgramType)
}

export const INDIVIDUAL_SETTLEMENT_DISABLED_CODE = 'INDIVIDUAL_SETTLEMENT_DISABLED'
export const INDIVIDUAL_SETTLEMENT_NOT_FOUND_CODE = 'SETTLEMENT_NOT_FOUND'

export const INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE =
  '일정별 정산 서비스를 사용할 수 없습니다'

export const INDIVIDUAL_SETTLEMENT_EMPTY_SCHEDULES_MESSAGE = '정산 대상 일정이 없어요'

export const RECEIPT_PRE_CONSENT_REQUIRED_CODE = 'RECEIPT_PRE_CONSENT_REQUIRED'
export const RECEIPT_PRE_CONSENT_REQUIRED_MESSAGE =
  '영수증 발급 사전 동의를 완료한 뒤 정산을 신청할 수 있습니다.'

export const INDIVIDUAL_INELIGIBLE_REASON = {
  ATTENDANCE_NOT_QUALIFIED: 'ATTENDANCE_NOT_QUALIFIED',
  SCHEDULE_NOT_ENDED: 'SCHEDULE_NOT_ENDED',
  SUBMISSION_DEADLINE_PASSED: 'SUBMISSION_DEADLINE_PASSED',
  NO_PAYABLE_ITEMS: 'NO_PAYABLE_ITEMS',
  EVIDENCE_POLICY_UNCONFIGURED: 'EVIDENCE_POLICY_UNCONFIGURED',
  LEGACY_RECONCILIATION_REQUIRED: 'LEGACY_RECONCILIATION_REQUIRED',
} as const

export type IndividualIneligibleReason =
  (typeof INDIVIDUAL_INELIGIBLE_REASON)[keyof typeof INDIVIDUAL_INELIGIBLE_REASON]

const INELIGIBLE_REASON_MESSAGES: Record<string, string> = {
  ATTENDANCE_NOT_QUALIFIED: '출석이 확인되지 않아 영수증을 제출할 수 없습니다.',
  SCHEDULE_NOT_ENDED: '교육이 종료된 이후에 영수증을 제출할 수 있습니다.',
  SUBMISSION_DEADLINE_PASSED: '프로그램 운영이 종료되어 영수증을 제출할 수 없습니다.',
  NO_PAYABLE_ITEMS: '이 프로그램에 신청할 수 있는 지급 항목이 없습니다.',
  EVIDENCE_POLICY_UNCONFIGURED: '증빙 정책을 확인할 수 없어 신청할 수 없습니다',
  EVIDENCE_REQUIRED: '증빙이 필요한 항목의 영수증을 제출해 주세요.',
  EVIDENCE_FILE_REQUIRED: '증빙 파일 업로드가 완료되지 않았습니다. 다시 시도해 주세요.',
  PAYMENT_ITEM_REQUIRED: '이 프로그램에 신청할 수 있는 지급 항목이 없습니다.',
  PAYMENT_ITEM_NOT_ALLOWED: '신청할 수 없는 지급 항목이 포함되어 있습니다.',
  DUPLICATE_PAYMENT_ITEM: '같은 지급 항목을 중복으로 신청할 수 없습니다.',
  FILE_ATTACHED_MORE_THAN_ONCE: '같은 파일을 여러 항목에 첨부할 수 없습니다.',
  LEGACY_RECONCILIATION_REQUIRED:
    '기존 정산 내역 확인이 필요합니다. 관리자에게 문의해 주세요.',
  INDIVIDUAL_SETTLEMENT_DISABLED: INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  SETTLEMENT_NOT_FOUND:
    '개인 프로그램 신청 정산만 이 화면에서 조회할 수 있습니다. 강사·기관 프로그램은 강사 배정 정산을 이용해 주세요.',
  RECEIPT_PRE_CONSENT_REQUIRED: RECEIPT_PRE_CONSENT_REQUIRED_MESSAGE,
}

export function normalizeIndividualIneligibleReason(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized ? normalized : null
}

export function individualIneligibleMessage(
  reason: string | null | undefined,
): string | undefined {
  const normalized = normalizeIndividualIneligibleReason(reason)
  if (!normalized) return undefined
  return INELIGIBLE_REASON_MESSAGES[normalized]
}

export function isEvidencePolicyUnconfigured(
  reason: string | null | undefined,
  payableItems?: readonly { evidenceRequired?: boolean | null }[] | null,
): boolean {
  if (normalizeIndividualIneligibleReason(reason) === 'EVIDENCE_POLICY_UNCONFIGURED') return true
  return (payableItems ?? []).some(item => item.evidenceRequired === null)
}

function readConflictReason(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as {
    reason?: unknown
    error?: { reason?: unknown; message?: unknown }
  }
  if (typeof record.reason === 'string' && record.reason.trim()) {
    return record.reason.trim().toUpperCase()
  }
  if (typeof record.error?.reason === 'string' && record.error.reason.trim()) {
    return record.error.reason.trim().toUpperCase()
  }
  return null
}

export function readIndividualSettlementErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractApiErrorCode(error.response?.data) ?? readConflictReason(error.response?.data)
}

export function individualSettlementApiErrorMessage(
  error: unknown,
  fallback = '영수증 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
): string {
  const code = readIndividualSettlementErrorCode(error)
  if (code && INELIGIBLE_REASON_MESSAGES[code]) return INELIGIBLE_REASON_MESSAGES[code]
  return fallback
}

export function isReceiptPreConsentRequiredError(error: unknown): boolean {
  return readIndividualSettlementErrorCode(error) === RECEIPT_PRE_CONSENT_REQUIRED_CODE
}
