import { isAxiosError } from 'axios'
import { PAYMENT_ITEM_LIMIT_EXCEEDED_FALLBACK_MESSAGE } from './payment-item-limit.ts'

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

/** 봉사자 일정별 영수증 정산 대상 프로그램 유형 — 일반(개인·기관)·UJAT. 1사1교·Gemini 봉사자는 대상 아님 */
const VOLUNTEER_SCHEDULE_SETTLEMENT_PROGRAM_TYPES = new Set([
  'GENERAL_INDIVIDUAL',
  'GENERAL_ORGANIZATION',
  'UJAT',
])

/**
 * GET volunteer-settlements/applications/{id}/schedules 호출 여부.
 * `id`는 `program_volunteer_application.id`(봉사현황 VOLUNTEER 신청)만 허용.
 * 프로그램 유형을 모르면 호출하지 않는다(대상 외 유형은 서버 404).
 */
export function shouldUseVolunteerSettlementSchedulesApi(
  applicationType: string | null | undefined,
  programType?: string | null,
): boolean {
  if (applicationType?.trim().toUpperCase() !== 'VOLUNTEER') return false
  const normalizedProgramType = programType?.trim().toUpperCase()
  return Boolean(
    normalizedProgramType && VOLUNTEER_SCHEDULE_SETTLEMENT_PROGRAM_TYPES.has(normalizedProgramType),
  )
}

/** 일정별 영수증 정산 API 경로 — 개인(INDIVIDUAL) · 봉사자(VOLUNTEER). 대상이 아니면 null */
export type ScheduleSettlementAudience = 'individual' | 'volunteer'

export function resolveScheduleSettlementAudience(
  applicationType: string | null | undefined,
  programType?: string | null,
): ScheduleSettlementAudience | null {
  if (shouldUseIndividualSettlementSchedulesApi(applicationType, programType)) return 'individual'
  if (shouldUseVolunteerSettlementSchedulesApi(applicationType, programType)) return 'volunteer'
  return null
}

export const INDIVIDUAL_SETTLEMENT_DISABLED_CODE = 'INDIVIDUAL_SETTLEMENT_DISABLED'
export const INDIVIDUAL_SETTLEMENT_NOT_FOUND_CODE = 'SETTLEMENT_NOT_FOUND'

export const INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE =
  '일정별 정산 서비스를 사용할 수 없습니다'

export const INDIVIDUAL_SETTLEMENT_EMPTY_SCHEDULES_MESSAGE = '정산 대상 일정이 없어요'

export const RECEIPT_PRE_CONSENT_REQUIRED_CODE = 'RECEIPT_PRE_CONSENT_REQUIRED'
export const RECEIPT_PRE_CONSENT_REQUIRED_MESSAGE =
  '영수증 발급 사전 동의를 완료한 뒤 정산을 신청할 수 있습니다.'

export const TRANSPORTATION_DISTANCE_NOT_ELIGIBLE_CODE = 'TRANSPORTATION_DISTANCE_NOT_ELIGIBLE'
/** 서버 TRANSPORTATION_DISTANCE_NOT_ELIGIBLE 문구와 같다 (R11) */
export const TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE =
  '편도 30km 이상 이동한 경우에만 교통비를 신청할 수 있어요.'
export const TRANSPORTATION_ADDRESS_MISSING_MESSAGE =
  '자택 주소 또는 교육 장소를 확인할 수 없어 교통비를 신청할 수 없어요. 회원정보의 자택 주소를 확인해 주세요.'

type IndividualTransportPreviewLike = {
  oneWayDistanceKm?: number | null
  eligible?: boolean
  ineligibleReason?: string | null
}

/** 서버 편도 km 그대로 표시. null·비정상 값은 null(0km로 채우지 않는다). */
export function formatIndividualOneWayDistanceKm(km: number | null | undefined): string | null {
  if (typeof km !== 'number' || !Number.isFinite(km)) return null
  return `${km.toLocaleString('ko-KR', { maximumFractionDigits: 3 })}km`
}

/**
 * 회차 transportPreview → 교통비 신청 불가 안내. 지급 가능(eligible)이거나 preview가 없으면 null.
 * 신청란 숨김 여부는 payableItems가 결정하고, 이 문구는 안내용이다.
 */
export function individualTransportIneligibleNotice(
  preview: IndividualTransportPreviewLike | null | undefined,
): string | null {
  if (!preview || preview.eligible !== false) return null
  const reason = normalizeIndividualIneligibleReason(preview.ineligibleReason)
  if (reason === 'ADDRESS_MISSING') return TRANSPORTATION_ADDRESS_MISSING_MESSAGE
  const km = formatIndividualOneWayDistanceKm(preview.oneWayDistanceKm)
  return km
    ? `${TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE}(편도 ${km})`
    : TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE
}

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
  /** 서버 오류 문구 (R5). 정산 행 안내는 individualIneligibleRowMessage가 따로 쓴다 */
  SUBMISSION_DEADLINE_PASSED: '프로그램 운영이 종료되어 영수증을 제출할 수 없어요',
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
  TRANSPORTATION_DISTANCE_NOT_ELIGIBLE: TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE,
  /** 금액이 들어간 문구는 확인 화면이 draft 한도로 만든다(payment-item-limit). */
  PAYMENT_ITEM_LIMIT_EXCEEDED: PAYMENT_ITEM_LIMIT_EXCEEDED_FALLBACK_MESSAGE,
}

export function normalizeIndividualIneligibleReason(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized ? normalized : null
}

/** 영수증 정산 행 안내 — 운영 종료 후 (R5). 영수증은 지연 제출 구간이 없다 */
export const RECEIPT_SUBMISSION_CLOSED_ROW_MESSAGE = '영수증 제출기한이 마감되었어요'

/** 봉사자 정산 — 개인(교육)과 문구가 다른 사유만 */
const VOLUNTEER_INELIGIBLE_REASON_MESSAGES: Record<string, string> = {
  SCHEDULE_NOT_ENDED: '봉사가 종료된 이후에 영수증을 제출할 수 있습니다.',
}

export function individualIneligibleMessage(
  reason: string | null | undefined,
  audience: ScheduleSettlementAudience = 'individual',
): string | undefined {
  const normalized = normalizeIndividualIneligibleReason(reason)
  if (!normalized) return undefined
  if (audience === 'volunteer' && VOLUNTEER_INELIGIBLE_REASON_MESSAGES[normalized]) {
    return VOLUNTEER_INELIGIBLE_REASON_MESSAGES[normalized]
  }
  return INELIGIBLE_REASON_MESSAGES[normalized]
}

/** 정산 행 안내용 제출 불가 사유 — 운영 종료(SUBMISSION_DEADLINE_PASSED)만 행 문구가 다르다 (R5) */
export function individualIneligibleRowMessage(
  reason: string | null | undefined,
  audience: ScheduleSettlementAudience = 'individual',
): string | undefined {
  if (normalizeIndividualIneligibleReason(reason) === INDIVIDUAL_INELIGIBLE_REASON.SUBMISSION_DEADLINE_PASSED) {
    return RECEIPT_SUBMISSION_CLOSED_ROW_MESSAGE
  }
  return individualIneligibleMessage(reason, audience)
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

/** 서버 오류 message (error.message → message). 없으면 null */
function readApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const body = data as { message?: unknown; error?: { message?: unknown } }
  const nested = body.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
  return null
}

export function readIndividualSettlementErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  return extractApiErrorCode(error.response?.data) ?? readConflictReason(error.response?.data)
}

/** 봉사자 경로 404 — 본인 봉사 신청이 아니거나, 대상 프로그램(1사1교 등 제외)이 아니거나, 승인 전이다. */
export const VOLUNTEER_SETTLEMENT_NOT_FOUND_MESSAGE =
  '영수증을 제출할 수 있는 봉사 신청을 찾을 수 없습니다. 봉사 신청 승인 여부를 확인해 주세요.'

export function individualSettlementApiErrorMessage(
  error: unknown,
  fallback = '영수증 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
  audience: 'individual' | 'volunteer' = 'individual',
): string {
  const code = readIndividualSettlementErrorCode(error)
  if (audience === 'volunteer' && code === INDIVIDUAL_SETTLEMENT_NOT_FOUND_CODE) {
    return VOLUNTEER_SETTLEMENT_NOT_FOUND_MESSAGE
  }
  if (code === TRANSPORTATION_DISTANCE_NOT_ELIGIBLE_CODE) {
    return readApiErrorMessage(error) ?? TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE
  }
  if (code && INELIGIBLE_REASON_MESSAGES[code]) return INELIGIBLE_REASON_MESSAGES[code]
  return fallback
}

export function isReceiptPreConsentRequiredError(error: unknown): boolean {
  return readIndividualSettlementErrorCode(error) === RECEIPT_PRE_CONSENT_REQUIRED_CODE
}
