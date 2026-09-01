import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

/**
 * 지급 현황 상세 · 목록 총액과 동일:
 * 신청 반려 · 지급 정정 요청은 합산에서 제외 (Notion 1-3).
 */
export function sumCountablePaymentOrderLineAmounts(
  rows: ReadonlyArray<{
    estimatedAmount: number
    processingStatus: PaymentOrderAdminLineProcessingStatus
  }>
): number {
  return rows.reduce((sum, row) => {
    if (
      row.processingStatus === 'application_rejected' ||
      row.processingStatus === 'correction'
    ) {
      return sum
    }
    return sum + (row.estimatedAmount ?? 0)
  }, 0)
}

/** 개인 프로그램 등 기관 없음 → 테이블 셀 비노출(공란). `-` 플레이스홀더 금지. */
export function formatPaymentOrderInstitutionDisplay(
  institutionName: string | null | undefined
): string {
  const trimmed = institutionName?.trim()
  if (!trimmed || trimmed === '-') return ''
  return trimmed
}
