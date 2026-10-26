import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

const PAYMENT_STATEMENT_STATUS_CONFLICT = 'PAYMENT_STATEMENT_STATUS_CONFLICT'
const PAYMENT_STATEMENT_CONFLICT_FALLBACK =
  '이미 확인된 지급조서가 포함되어 있습니다. 목록을 새로고침한 뒤 다시 확인해 주세요.'

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
}

function readAxiosResponse(error: unknown): { status?: number; data?: unknown } | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  return (error as { response?: { status?: number; data?: unknown } }).response ?? null
}

function readErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as { error?: { code?: unknown }; code?: unknown }
  if (typeof envelope.error?.code === 'string') return envelope.error.code
  if (typeof envelope.code === 'string') return envelope.code
  return undefined
}

export function getSettlementApiErrorMessage(error: unknown, fallback: string): string {
  const response = readAxiosResponse(error)
  if (response) {
    if (response.status === 403) {
      return '정산 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
    }

    const code = readErrorCode(response.data)
    const mapped = code ? SETTLEMENT_BULK_CONFIRM_ERROR_MESSAGES[code] : undefined
    if (mapped) {
      if (
        code === SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED ||
        code === FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED ||
        code === SENSITIVE_FILE_RELAY_REQUIRED
      ) {
        return mapped
      }
      const msg = extractApiErrorMessage(response.data, {
        httpStatus: response.status,
        fallback: mapped,
      }).trim()
      // 서버가 code만 주거나 공통 문구만 주면 FE 매핑 우선
      if (!msg || msg === code) return mapped
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

export function getSettlementApiErrorCode(error: unknown): string | undefined {
  return readErrorCode(readAxiosResponse(error)?.data)
}

export function isSettlementExportAlreadyDownloadedError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  return response?.status === 409 && getSettlementApiErrorCode(error) === SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED
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
  return readErrorCode(response.data) === PAYMENT_STATEMENT_STATUS_CONFLICT
}
