import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

const PAYMENT_STATEMENT_STATUS_CONFLICT = 'PAYMENT_STATEMENT_STATUS_CONFLICT'
const PAYMENT_STATEMENT_CONFLICT_FALLBACK =
  '이미 확인된 지급조서가 포함되어 있습니다. 목록을 새로고침한 뒤 다시 확인해 주세요.'

/** BE가 code별 안내 대신 공통 문구만 줄 때 FE 매핑을 쓴다 */
const GENERIC_SETTLEMENT_API_MESSAGES = new Set([
  '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  '요청 처리 중 오류가 발생했습니다.',
])

export const SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED =
  'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED'
export const FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED = 'FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED'
export const SENSITIVE_FILE_RELAY_REQUIRED = 'SENSITIVE_FILE_RELAY_REQUIRED'

export const SETTLEMENT_EXPORT_ALREADY_DOWNLOADED_MESSAGE =
  '이미 다운로드한 정산 양식은 다시 받을 수 없습니다. 양식을 새로 발급해 주세요.'
export const FILE_DOWNLOAD_TOKEN_INVALID_MESSAGE =
  '다운로드 토큰이 만료되었거나 유효하지 않습니다. 양식을 새로 발급해 주세요.'
export const SENSITIVE_FILE_RELAY_REQUIRED_MESSAGE =
  '민감 정산 파일은 일반 다운로드 주소로 받을 수 없습니다. 미리보기에서 엑셀 다운로드를 다시 시도해 주세요.'
export const SETTLEMENT_CORRECTION_PAID_NOT_RESTORABLE =
  'SETTLEMENT_CORRECTION_PAID_NOT_RESTORABLE'
export const SETTLEMENT_CORRECTION_RESTORE_STATUS_UNAVAILABLE =
  'SETTLEMENT_CORRECTION_RESTORE_STATUS_UNAVAILABLE'
export const SETTLEMENT_CONFIG_WITHHOLDING_RATE_INVALID =
  'SETTLEMENT_CONFIG_WITHHOLDING_RATE_INVALID'
export const SETTLEMENT_CONFIG_WITHHOLDING_AMOUNT_INVALID =
  'SETTLEMENT_CONFIG_WITHHOLDING_AMOUNT_INVALID'

/** BE 정산 정정 수동 책정 — 단가/단위/차시 */
export const SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED =
  'SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED'
export const SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID =
  'SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID'
export const SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED =
  'SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED'

/** BE 세금신고 RAW 발급 409 — code에 `:count=…;ids=…` 접미사 가능 */
export const LEGACY_GEMINI_TAX_SNAPSHOT_MISSING = 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING'
export const TAX_REPORT_REQUIRED_IDENTITY_MISSING = 'TAX_REPORT_REQUIRED_IDENTITY_MISSING'

export const LEGACY_GEMINI_TAX_SNAPSHOT_MISSING_MESSAGE =
  '기존 제미나이 지급 건의 세금 정보가 누락되어 세금신고 파일을 발급할 수 없습니다. 관리자 확인이 필요합니다.'
export const TAX_REPORT_REQUIRED_IDENTITY_MISSING_MESSAGE =
  '세금신고에 필요한 소득자 신원정보가 누락되어 파일을 발급할 수 없습니다. 누락된 지급 건을 확인해 주세요.'

export const SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED_MESSAGE =
  '기타 인건비·특강 수동 책정 단가를 입력해 주세요. 0원 이하 금액은 사용할 수 없습니다.'
export const SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID_MESSAGE =
  '지급 기준 단위가 올바르지 않습니다. 출강 1회당·1시간당·1차시당 중 하나를 선택해 주세요.'
export const SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED_MESSAGE =
  '1차시당 책정에 필요한 차시 수가 없어 정산을 확정할 수 없습니다. 교육 시간을 확인해 주세요.'

/**
 * Gemini 연수 실적(시작·종료 시각) 누락으로 차시 산출 불가.
 * 코드는 BE 확정 전 FE 가정값 — OpenAPI/공통 오류 코드 확정 후 동기화 필요.
 */
export const GEMINI_TRAINING_REPORT_MISSING = 'GEMINI_TRAINING_REPORT_MISSING'
export const GEMINI_TRAINING_REPORT_MISSING_MESSAGE =
  'Gemini 연수 실적(시작·종료 시각)이 없어 차시를 산출할 수 없습니다.'

/** BE 2026-09-11 bulk-confirm 계약 — 공통 메시지 없을 때 FE fallback */
const SETTLEMENT_BULK_CONFIRM_ERROR_MESSAGES: Record<string, string> = {
  SCHEDULED_PAYMENT_DATE_REQUIRED: '강의비 지급 예정일을 입력해 주세요.',
  PAYMENT_STATEMENT_IDS_REQUIRED: '확인할 지급조서를 선택해 주세요.',
  PAYMENT_STATEMENT_NOT_FOUND: '지급조서를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
  [PAYMENT_STATEMENT_STATUS_CONFLICT]: PAYMENT_STATEMENT_CONFLICT_FALLBACK,
  [SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED]: SETTLEMENT_EXPORT_ALREADY_DOWNLOADED_MESSAGE,
  [FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED]: FILE_DOWNLOAD_TOKEN_INVALID_MESSAGE,
  [SENSITIVE_FILE_RELAY_REQUIRED]: SENSITIVE_FILE_RELAY_REQUIRED_MESSAGE,
  [SETTLEMENT_CORRECTION_PAID_NOT_RESTORABLE]:
    '이미 지급 완료된 정산은 원상 복구할 수 없어 정정 반려할 수 없습니다.',
  [SETTLEMENT_CORRECTION_RESTORE_STATUS_UNAVAILABLE]:
    '정정 반려 후 정산 상태를 복구할 수 없어 처리하지 못했습니다. 상태를 임의로 변경하지 말고 다시 조회해 주세요.',
  [SETTLEMENT_CONFIG_WITHHOLDING_RATE_INVALID]:
    '원천징수 세율 입력값을 확인해 주세요. 퍼센트 단위로 0 이상 100 이하를 입력해야 합니다.',
  [SETTLEMENT_CONFIG_WITHHOLDING_AMOUNT_INVALID]:
    '원천징수 금액 입력값을 확인해 주세요. 0 이상의 원 단위 금액을 입력해야 합니다.',
  SETTLEMENT_EXPORT_SCOPE_TOKEN_REQUIRED:
    '선택·필터 원본 발급은 서버 발급 범위 확인(scopeToken)이 필요합니다.',
  SETTLEMENT_EXPORT_SCOPE_TOKEN_INVALID: '발급 범위 확인이 유효하지 않습니다. 범위를 다시 확인해 주세요.',
  SETTLEMENT_EXPORT_SCOPE_TOKEN_EXPIRED: '발급 범위 확인이 만료되었습니다. 범위를 다시 확인해 주세요.',
  [SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED]: SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED_MESSAGE,
  [SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID]:
    SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID_MESSAGE,
  [SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED]: SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED_MESSAGE,
  [LEGACY_GEMINI_TAX_SNAPSHOT_MISSING]: LEGACY_GEMINI_TAX_SNAPSHOT_MISSING_MESSAGE,
  [TAX_REPORT_REQUIRED_IDENTITY_MISSING]: TAX_REPORT_REQUIRED_IDENTITY_MISSING_MESSAGE,
  [GEMINI_TRAINING_REPORT_MISSING]: GEMINI_TRAINING_REPORT_MISSING_MESSAGE,
  SETTLEMENT_BANK_ACCOUNT_REQUIRED:
    '지급조서 사전 동의서를 작성·완료하세요. 등록된 정산 계좌가 없어 계좌이체를 생성할 수 없습니다.',
  SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY:
    '정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.',
}

/** FE가 서버 공통 문구를 덮어쓰는 export/tax 코드 (접미사 포함 raw도 동일) */
const FORCE_FE_MAPPED_CODES = new Set([
  SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED,
  FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED,
  SENSITIVE_FILE_RELAY_REQUIRED,
  LEGACY_GEMINI_TAX_SNAPSHOT_MISSING,
  TAX_REPORT_REQUIRED_IDENTITY_MISSING,
  SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED,
  SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID,
  SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED,
  GEMINI_TRAINING_REPORT_MISSING,
  'SETTLEMENT_BANK_ACCOUNT_REQUIRED',
])

export type NormalizedSettlementApiErrorCode = {
  /** 서버가 준 원본 코드 문자열 */
  rawCode: string
  /** 첫 번째 `:` 이전 안정 코드 */
  stableCode: string
  /** `count=` 파싱 결과. 없거나 비정상이면 null */
  missingCount: number | null
  /** `ids=` 파싱 결과. 유효한 양의 정수만, 중복 제거·등장 순 */
  paymentIds: number[]
}

function readAxiosResponse(error: unknown): { status?: number; data?: unknown } | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  return (error as { response?: { status?: number; data?: unknown } }).response ?? null
}

function readRawErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as { error?: { code?: unknown }; code?: unknown }
  if (typeof envelope.error?.code === 'string') return envelope.error.code
  if (typeof envelope.code === 'string') return envelope.code
  return undefined
}

function parsePositiveIntToken(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

/**
 * BE 세금신고 등: `STABLE:count=2;ids=101,102` 형태를 안전하게 분리한다.
 * 잘못된 접미사·비숫자 ids·중복은 버리고 stableCode만 보장한다.
 */
export function normalizeSettlementApiErrorCode(
  rawCode: string | null | undefined
): NormalizedSettlementApiErrorCode | null {
  if (typeof rawCode !== 'string') return null
  const trimmed = rawCode.trim()
  if (!trimmed) return null

  const colonIdx = trimmed.indexOf(':')
  const stableCode = (colonIdx === -1 ? trimmed : trimmed.slice(0, colonIdx)).trim()
  if (!stableCode) return null

  const suffix = colonIdx === -1 ? '' : trimmed.slice(colonIdx + 1)
  let missingCount: number | null = null
  const paymentIds: number[] = []
  const seen = new Set<number>()

  if (suffix) {
    for (const part of suffix.split(';')) {
      const eq = part.indexOf('=')
      if (eq <= 0) continue
      const key = part.slice(0, eq).trim().toLowerCase()
      const value = part.slice(eq + 1).trim()
      if (key === 'count') {
        missingCount = parsePositiveIntToken(value)
        continue
      }
      if (key === 'ids') {
        for (const token of value.split(',')) {
          const id = parsePositiveIntToken(token)
          if (id == null || seen.has(id)) continue
          seen.add(id)
          paymentIds.push(id)
        }
      }
    }
  }

  return {
    rawCode: trimmed,
    stableCode,
    missingCount,
    paymentIds,
  }
}

function appendAdminPaymentIdsHint(baseMessage: string, paymentIds: number[]): string {
  if (paymentIds.length === 0) return baseMessage
  // 관리자 화면용 — 개인정보 없는 지급 ID만. raw code/접미사 전체는 출력하지 않는다.
  const preview = paymentIds.slice(0, 20)
  const more = paymentIds.length > preview.length ? ` 외 ${paymentIds.length - preview.length}건` : ''
  return `${baseMessage} (지급 ID: ${preview.join(', ')}${more})`
}

function messageForNormalizedCode(
  normalized: NormalizedSettlementApiErrorCode
): string | undefined {
  const mapped = SETTLEMENT_BULK_CONFIRM_ERROR_MESSAGES[normalized.stableCode]
  if (!mapped) return undefined
  if (
    normalized.stableCode === LEGACY_GEMINI_TAX_SNAPSHOT_MISSING ||
    normalized.stableCode === TAX_REPORT_REQUIRED_IDENTITY_MISSING
  ) {
    return appendAdminPaymentIdsHint(mapped, normalized.paymentIds)
  }
  return mapped
}

export function getSettlementApiErrorMessage(error: unknown, fallback: string): string {
  const response = readAxiosResponse(error)
  if (response) {
    if (response.status === 403) {
      return '정산 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }

    const normalized = normalizeSettlementApiErrorCode(readRawErrorCode(response.data))
    const mapped = normalized ? messageForNormalizedCode(normalized) : undefined
    if (mapped && normalized) {
      if (FORCE_FE_MAPPED_CODES.has(normalized.stableCode)) {
        return mapped
      }
      const msg = extractApiErrorMessage(response.data, {
        httpStatus: response.status,
        fallback: mapped,
      }).trim()
      // 서버가 code만 주거나 공통 문구만 주면 FE 매핑 우선
      if (
        !msg ||
        msg === normalized.stableCode ||
        msg === normalized.rawCode ||
        GENERIC_SETTLEMENT_API_MESSAGES.has(msg)
      ) {
        return mapped
      }
      return msg
    }

    return extractApiErrorMessage(response.data, {
      httpStatus: response.status,
      fallback,
    })
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

/** 안정 코드(접미사 제거). 매핑·분기용 */
export function getSettlementApiErrorCode(error: unknown): string | undefined {
  return normalizeSettlementApiErrorCode(readRawErrorCode(readAxiosResponse(error)?.data))
    ?.stableCode
}

/** 원본 코드 + count/ids 파싱. UI·진단용 */
export function getNormalizedSettlementApiError(
  error: unknown
): NormalizedSettlementApiErrorCode | null {
  return normalizeSettlementApiErrorCode(readRawErrorCode(readAxiosResponse(error)?.data))
}

export function isSettlementExportAlreadyDownloadedError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  return (
    response?.status === 409 &&
    getSettlementApiErrorCode(error) === SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED
  )
}

export function isSettlementExportReissueRequiredError(error: unknown): boolean {
  const code = getSettlementApiErrorCode(error)
  if (code === SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED) {
    return isSettlementExportAlreadyDownloadedError(error)
  }
  if (code !== FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED) return false
  const status = readAxiosResponse(error)?.status
  return status === 400 || status === 401 || status === 403 || status === 409 || status === 410
}

export function getSettlementConfigErrorField(
  error: unknown
): 'withholdingRate' | 'withholdingAmount' | undefined {
  const code = getSettlementApiErrorCode(error)
  if (code === SETTLEMENT_CONFIG_WITHHOLDING_RATE_INVALID) return 'withholdingRate'
  if (code === SETTLEMENT_CONFIG_WITHHOLDING_AMOUNT_INVALID) return 'withholdingAmount'
  return undefined
}

export function isPaymentStatementStatusConflictError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  if (response?.status !== 409) return false
  return getSettlementApiErrorCode(error) === PAYMENT_STATEMENT_STATUS_CONFLICT
}

export function isTaxReportIdentityOrSnapshotMissingError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  if (response?.status !== 409) return false
  const code = getSettlementApiErrorCode(error)
  return (
    code === LEGACY_GEMINI_TAX_SNAPSHOT_MISSING || code === TAX_REPORT_REQUIRED_IDENTITY_MISSING
  )
}
