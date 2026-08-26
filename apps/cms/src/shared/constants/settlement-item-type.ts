import type { SettlementItemType } from '@/types/domain'

/** `SettlementFrontendItemResponse.type` / 정산 항목 enum → 화면 라벨 */
export const SETTLEMENT_ITEM_TYPE_LABELS: Record<SettlementItemType, string> = {
  instructor_fee: '강사비',
  transportation: '교통비',
  accommodation: '숙박비',
  meal: '식사비',
  activity: '활동비',
  withholding: '원천징수',
  other: '기타',
}

export function formatSettlementItemTypeLabel(
  type: string | undefined,
  fallback = '정산 항목'
): string {
  const normalized = type?.trim()
  if (!normalized) return fallback
  return SETTLEMENT_ITEM_TYPE_LABELS[normalized as SettlementItemType] ?? normalized
}

/** 산출 내역서 API item → 산정 항목 컬럼 라벨 */
export function formatPaymentOrderCalculationItemLabel(
  type: string | undefined,
  amount: number,
  fallback = '정산 항목'
): string {
  const normalized = type?.trim()
  if (normalized && normalized in SETTLEMENT_ITEM_TYPE_LABELS) {
    return SETTLEMENT_ITEM_TYPE_LABELS[normalized as SettlementItemType]
  }
  if (amount < 0) return '원천징수'
  return formatSettlementItemTypeLabel(type, fallback)
}
