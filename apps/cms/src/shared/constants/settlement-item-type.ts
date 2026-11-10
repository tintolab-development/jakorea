import type { SettlementItemType } from '@/types/domain'

/** 정산 설정 공제 항목 — BE 시드 canonical itemName (layout=withholdingDailyWorker로 식별). */
export const SETTLEMENT_WITHHOLDING_ITEM_LABEL = '원천징수세액' as const
/** UI/구 시드 짧은 표기. 표시는 GET itemName 그대로, PUT은 편집한 제목을 itemName으로 보낸다(별도 정규화 금지). */
export const SHORT_SETTLEMENT_WITHHOLDING_ITEM_LABEL = '원천징수세액' as const
/** @deprecated SHORT와 동일. 기존 import 호환 */
export const LEGACY_SETTLEMENT_WITHHOLDING_ITEM_LABEL = SHORT_SETTLEMENT_WITHHOLDING_ITEM_LABEL

/** `SettlementFrontendItemResponse.type` / 정산 항목 enum → 화면 라벨 */
export const SETTLEMENT_ITEM_TYPE_LABELS: Record<SettlementItemType, string> = {
  instructor_fee: '강사비',
  transportation: '교통비',
  accommodation: '숙박비',
  meal: '식사비',
  activity: '참여자 활동비',
  withholding: '원천징수',
  other: '기타',
}

const SETTLEMENT_ITEM_TYPE_ALIASES: Record<string, SettlementItemType> = {
  TRANSPORTATION: 'transportation',
  ACCOMMODATION: 'accommodation',
  LODGING: 'accommodation',
  MEAL: 'meal',
  ACTIVITY: 'activity',
  WITHHOLDING: 'withholding',
  INSTRUCTOR_FEE: 'instructor_fee',
  OTHER: 'other',
}

export function formatSettlementItemTypeLabel(
  type: string | undefined,
  fallback = '정산 항목'
): string {
  const normalized = type?.trim()
  if (!normalized) return fallback
  if (normalized in SETTLEMENT_ITEM_TYPE_LABELS) {
    return SETTLEMENT_ITEM_TYPE_LABELS[normalized as SettlementItemType]
  }
  const aliased = SETTLEMENT_ITEM_TYPE_ALIASES[normalized.toUpperCase()]
  if (aliased) return SETTLEMENT_ITEM_TYPE_LABELS[aliased]
  if (/^[A-Z][A-Z0-9_]*$/.test(normalized)) return fallback
  return normalized
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
