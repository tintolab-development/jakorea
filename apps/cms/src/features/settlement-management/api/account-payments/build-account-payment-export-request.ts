import type { SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'

/** BE는 PAID만 허용. WAITING_PAYMENT / FAILED / CONFIRMED 전송 시 거절. */
export const ACCOUNT_PAYMENT_EXPORT_STATUS_PAID = 'PAID' as const

const EXPORT_REASON = '계좌 지급 확인 — 양식 발급'
const EXPORT_BUSINESS_PURPOSE = '정산 관리 대량이체·세금신고 양식'

export type BuildAccountPaymentExportRequestInput = {
  fromDate?: string
  toDate?: string
  kind: 'bulk-transfer' | 'tax-report'
}

/**
 * 대량이체·세금신고 export body.
 * status는 항상 PAID — 선택 건 UI 검증 후 호출.
 */
export function buildAccountPaymentExportRequest(
  input: BuildAccountPaymentExportRequestInput
): SettlementExportRequest {
  const label =
    input.kind === 'bulk-transfer' ? '대량이체 양식 발급' : '세금신고 양식 발급'
  return {
    status: ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
    reason: `${EXPORT_REASON} (${label})`,
    businessPurpose: EXPORT_BUSINESS_PURPOSE,
    ...(input.fromDate && input.toDate
      ? { fromDate: input.fromDate, toDate: input.toDate, dateRangeValid: true }
      : {}),
  }
}
