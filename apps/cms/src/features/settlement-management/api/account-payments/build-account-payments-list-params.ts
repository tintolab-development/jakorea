import type { AccountPaymentListFilterStatus } from '@/shared/constants/payment-order-aggregate-status'
import type { ListAccountPaymentsParams } from '@/shared/api/generated/settlement/schemas'

export type AccountPaymentsListFilterInput = {
  instructorName?: string
  programName?: string
  /** UI 2종 필터. `all`이면 status 생략 */
  accountStatus?: 'all' | AccountPaymentListFilterStatus
  /** 이체 예정일 구간 (YYYY-MM-DD) */
  fromDate?: string
  toDate?: string
  /** fromDate/toDate가 없을 때 BE 연도 윈도우 (목록만; 연도 탭 예산과 분리) */
  year?: number
}

/**
 * UI 계좌 지급 대기 → BE canonical `WAITING_PAYMENT`.
 * (`REQUESTED` alias도 BE가 대기 버킷으로 해석하지만, 지급조서 REQUESTED와 혼동 방지를 위해 WAITING_PAYMENT 사용)
 */
export function mapAccountPaymentUiStatusToApiStatus(
  status: AccountPaymentListFilterStatus
): 'WAITING_PAYMENT' | 'PAID' {
  return status === 'account_paid' ? 'PAID' : 'WAITING_PAYMENT'
}

export function buildAccountPaymentsListParams(
  filters: AccountPaymentsListFilterInput = {}
): Omit<ListAccountPaymentsParams, 'page' | 'size'> {
  const params: Omit<ListAccountPaymentsParams, 'page' | 'size'> = {}

  const instructorName = filters.instructorName?.trim()
  if (instructorName) params.instructorName = instructorName

  const programName = filters.programName?.trim()
  if (programName) params.programName = programName

  if (filters.accountStatus && filters.accountStatus !== 'all') {
    params.status = mapAccountPaymentUiStatusToApiStatus(filters.accountStatus)
  }

  if (filters.fromDate && filters.toDate) {
    params.fromDate = filters.fromDate
    params.toDate = filters.toDate
  } else if (filters.year != null) {
    params.year = filters.year
  }

  return params
}

/** TanStack Query list key — 실제 API params와 동일 소스 */
export function serializeAccountPaymentsListParamsKey(
  filters: AccountPaymentsListFilterInput = {}
): string {
  const params = buildAccountPaymentsListParams(filters)
  const keys = Object.keys(params).sort() as Array<keyof typeof params>
  const stable: Record<string, string | number> = {}
  for (const key of keys) {
    const value = params[key]
    if (value != null && value !== '') stable[key] = value
  }
  return JSON.stringify(stable)
}
