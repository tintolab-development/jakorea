import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'

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

/**
 * 지급 현황 「참여 기관명」표시.
 * BE `institutionName`만 사용 (배정 기관 → 일정 단일 기관 → 장소명, 없으면 null).
 * null·빈 문자열·`-` → 공란. `없음`/`미지정`/`—`로 치환하지 않음.
 */
export function formatPaymentOrderInstitutionDisplay(
  institutionName: string | null | undefined
): string {
  const trimmed = institutionName?.trim()
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return ''
  return trimmed
}
