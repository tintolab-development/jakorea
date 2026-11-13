import { isAxiosError } from 'axios'
import { LECTURE_FEE_SETTLEMENT_BLOCKER_MESSAGE } from './lecture-fee-preview.ts'

function extractApiErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

/** 사업 운영 종료 후 최초 지급조서 제출 (409, 미리보기 blockerCode) */
export const SETTLEMENT_BUSINESS_PERIOD_CLOSED_CODE = 'SETTLEMENT_BUSINESS_PERIOD_CLOSED'

export const INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE =
  'PAYMENT_STATEMENT_CONSENT_REQUIRED'

export const PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE =
  '지급조서 작성 동의를 완료한 뒤 정산을 신청할 수 있습니다.'

export const INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE: Record<string, string> = {
  // 정산 차단 3종·장거리 단가 미설정: 미리보기 차단 문구와 같다 (기획 K10·K11)
  ...LECTURE_FEE_SETTLEMENT_BLOCKER_MESSAGE,
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
  SETTLEMENT_REAPPLICATION_NOT_AVAILABLE:
    '지금은 지급조서를 재신청할 수 없어요. 화면을 새로고침한 뒤 다시 확인해 주세요.',
  SETTLEMENT_BUSINESS_PERIOD_CLOSED: '프로그램 운영이 종료되어 지급조서를 제출할 수 없어요',
  SETTLEMENT_BUSINESS_INCOME_STATUS_REQUIRED: '회원정보에서 사업소득자 여부를 선택해 주세요.',
  SETTLEMENT_CORRECTION_NOT_FOUND: '정정 내역을 찾을 수 없어요.',
}

/** 미리보기 지급 항목 0건 — 200 canSubmit=false의 blockerCode (BE 1b13439db) */
export const SETTLEMENT_CALCULATION_ITEMS_REQUIRED_CODE = 'SETTLEMENT_CALCULATION_ITEMS_REQUIRED'

/** 프로그램에서 꺼진 실비 항목을 requestedItems로 보냄 — 400, field=requestedItems (BE 1b13439db) */
export const SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED_CODE = 'SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED'

/** 서버 message를 먼저 쓰는 오류 코드 (없으면 위 문구 → 호출부 fallback) */
const SERVER_MESSAGE_FIRST_CODES = new Set([
  'SETTLEMENT_REAPPLICATION_DEADLINE_EXPIRED',
  'SETTLEMENT_CORRECTION_NOT_FOUND',
  SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED_CODE,
  SETTLEMENT_CALCULATION_ITEMS_REQUIRED_CODE,
])

/** blockerMessage·code 문구가 모두 없을 때 — 작성 화면의 기존 정산 차단 fallback과 같은 문구 */
export const INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE = '지금은 정산을 신청할 수 없습니다.'

/** 미리보기(200) 제출 차단 — canSubmit=false일 때만 */
export type InstructorPreviewSubmitBlock = {
  /** 대문자 blockerCode. 없으면 null */
  code: string | null
  /** 서버 blockerMessage → 같은 code의 기존 오류 문구 → fallback 순 */
  message: string
}

/**
 * 미리보기 응답 → 제출 차단 사유. canSubmit이 false가 아니면 null.
 * 문구는 서버 blockerMessage를 그대로 쓴다(모르는 code도 blockerMessage로 폴백).
 */
export function readInstructorPreviewSubmitBlock(preview: unknown): InstructorPreviewSubmitBlock | null {
  if (!preview || typeof preview !== 'object') return null
  const body = preview as { canSubmit?: unknown; blockerCode?: unknown; blockerMessage?: unknown }
  if (body.canSubmit !== false) return null
  const code =
    typeof body.blockerCode === 'string' && body.blockerCode.trim()
      ? body.blockerCode.trim().toUpperCase()
      : null
  const serverMessage =
    typeof body.blockerMessage === 'string' && body.blockerMessage.trim()
      ? body.blockerMessage.trim()
      : null
  return {
    code,
    message:
      serverMessage ??
      (code ? INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE[code] : undefined) ??
      INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE,
  }
}

export const PAYMENT_STATEMENT_REAPPLY_FAILED_MESSAGE =
  '지급조서 재신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'

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

/**
 * 409 — 교통비 거리 계산에 필요한 주소/경로를 찾지 못함 (외부 연동 장애 503 PROVIDER_UNAVAILABLE과 별개).
 * 재시도로 해결되지 않으므로 서버 message + addressSide별 보조 안내만 보여 준다. 신청은 생성되지 않는다.
 */
export const SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_CODE =
  'SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED'

export const SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_MESSAGE =
  '교통비 계산에 필요한 주소를 찾을 수 없습니다. 자택 주소 또는 교육 장소 주소를 확인하거나 관리자에게 문의해 주세요.'

const TRANSPORTATION_ADDRESS_SIDE_GUIDE: Record<string, string> = {
  ORIGIN: '마이페이지 > 강사 정보에서 자택 주소를 확인해 주세요.',
  DESTINATION: '교육 장소 주소 확인이 필요합니다. 관리자에게 문의해 주세요.',
}

const TRANSPORTATION_ADDRESS_DEFAULT_GUIDE = '관리자에게 문의해 주세요.'

type ApiErrorBody = {
  message?: unknown
  error?: { message?: unknown; details?: unknown }
}

function readApiErrorBody(error: unknown): ApiErrorBody | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  return data && typeof data === 'object' ? (data as ApiErrorBody) : null
}

/** `error.details` — Record<string, string> | null 로 취급 */
function readTransportationAddressSide(error: unknown): string | null {
  const details = readApiErrorBody(error)?.error?.details
  if (!details || typeof details !== 'object' || Array.isArray(details)) return null
  const side = (details as Record<string, unknown>).addressSide
  return typeof side === 'string' && side.trim() ? side.trim().toUpperCase() : null
}

function readServerErrorMessage(error: unknown): string | null {
  const body = readApiErrorBody(error)
  for (const candidate of [body?.error?.message, body?.message]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return null
}

export function isSettlementTransportationAddressUnresolvedError(error: unknown): boolean {
  return readInstructorSettlementErrorCode(error) === SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_CODE
}

/** 서버 message 그대로 + addressSide별 보조 안내 (ROUTE·UNKNOWN·값 없음·모르는 값 → 관리자 문의) */
export function settlementTransportationAddressUnresolvedMessage(error: unknown): string {
  const message = readServerErrorMessage(error) ?? SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_MESSAGE
  const side = readTransportationAddressSide(error)
  const guide = (side && TRANSPORTATION_ADDRESS_SIDE_GUIDE[side]) || TRANSPORTATION_ADDRESS_DEFAULT_GUIDE
  return message.includes(guide) ? message : `${message} ${guide}`
}

export function instructorSettlementApiErrorMessage(
  error: unknown,
  fallback = '지급조서 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
): string {
  if (isSettlementTransportationAddressUnresolvedError(error)) {
    return settlementTransportationAddressUnresolvedMessage(error)
  }
  const code = readInstructorSettlementErrorCode(error)
  if (code && SERVER_MESSAGE_FIRST_CODES.has(code)) {
    const serverMessage = readServerErrorMessage(error)
    if (serverMessage) return serverMessage
  }
  if (code && INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE[code]) {
    return INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE[code]
  }
  return fallback
}
