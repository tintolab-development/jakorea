import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'

export type SettlementByIdMap = Map<number, SettlementListItemResponse>

export function buildSettlementByIdMap(
  items: SettlementListItemResponse[]
): SettlementByIdMap {
  const map = new Map<number, SettlementListItemResponse>()
  for (const item of items) {
    const id = item.settlementId
    if (id != null) map.set(id, item)
  }
  return map
}

export function formatLectureSessionLabel(scheduleId?: number): string {
  if (scheduleId == null) return '-'
  return `${scheduleId}차시`
}
