import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

/**
 * 같은 `paymentItemType`에 활성 항목이 여러 개면 정산 계산은 id가 가장 작은 활성 항목을 쓴다.
 * 그 항목을 지우면 남은 항목이 계산 기준이 되므로, 이 경우에만 true를 돌려준다.
 */
export function isPaymentItemCalculationBasisWithSiblings(
  config: SettlementConfigResponse | undefined,
  itemId: number
): boolean {
  const items = (config?.paymentItems ?? []).filter(
    (item): item is typeof item & { id: number } => item.useYn !== false && item.id != null
  )
  const target = items.find(item => item.id === itemId)
  if (!target?.paymentItemType) return false
  const sameType = items.filter(item => item.paymentItemType === target.paymentItemType)
  if (sameType.length < 2) return false
  return Math.min(...sameType.map(item => item.id)) === itemId
}
