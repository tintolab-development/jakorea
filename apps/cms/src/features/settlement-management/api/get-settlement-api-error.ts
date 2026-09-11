import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

const PAYMENT_STATEMENT_STATUS_CONFLICT = 'PAYMENT_STATEMENT_STATUS_CONFLICT'
const PAYMENT_STATEMENT_CONFLICT_FALLBACK =
  '지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.'

/** BE 2026-09-11 bulk-confirm 계약 — 공통 메시지 없을 때 FE fallback */
const SETTLEMENT_BULK_CONFIRM_ERROR_MESSAGES: Record<string, string> = {
  SCHEDULED_PAYMENT_DATE_REQUIRED: '강의비 지급 예정일을 입력해 주세요.',
  PAYMENT_STATEMENT_IDS_REQUIRED: '확인할 지급조서를 선택해 주세요.',
  PAYMENT_STATEMENT_NOT_FOUND: '지급조서를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
  [PAYMENT_STATEMENT_STATUS_CONFLICT]: PAYMENT_STATEMENT_CONFLICT_FALLBACK,
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

export function isPaymentStatementStatusConflictError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  if (response?.status !== 409) return false
  return readErrorCode(response.data) === PAYMENT_STATEMENT_STATUS_CONFLICT
}
