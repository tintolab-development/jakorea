import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

const PAYMENT_STATEMENT_STATUS_CONFLICT = 'PAYMENT_STATEMENT_STATUS_CONFLICT'
const PAYMENT_STATEMENT_CONFLICT_FALLBACK =
  '지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.'

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
    if (response.status === 409 && code === PAYMENT_STATEMENT_STATUS_CONFLICT) {
      const msg = extractApiErrorMessage(response.data, {
        httpStatus: 409,
        fallback: PAYMENT_STATEMENT_CONFLICT_FALLBACK,
      })
      // extract가 code만 반환한 경우에도 사용자 문구를 보여준다
      if (msg === PAYMENT_STATEMENT_STATUS_CONFLICT) {
        return PAYMENT_STATEMENT_CONFLICT_FALLBACK
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

export function isPaymentStatementStatusConflictError(error: unknown): boolean {
  const response = readAxiosResponse(error)
  if (response?.status !== 409) return false
  return readErrorCode(response.data) === PAYMENT_STATEMENT_STATUS_CONFLICT
}
