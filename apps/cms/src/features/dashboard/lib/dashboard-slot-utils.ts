/**
 * 대시보드 슬롯 유틸 (높이 등)
 * 슬롯 높이 단일 소스: dashboard-config `slotHeightPx` → DisplayItemMeta → 여기서 인라인 height로 전달
 */

import type { DisplayItemMeta } from '@/features/dashboard/model/dashboard-widget-order-store'

/**
 * SortableWidgetSlot에 넘길 고정 높이(px). undefined면 colSpan 12일 때만 400px 등 기본 규칙 적용.
 */
export function getSlotHeight(effectiveColSpan: 12 | 24, meta: DisplayItemMeta): number | undefined {
  const bySpan = meta.slotHeightPx?.[effectiveColSpan]
  if (bySpan !== undefined) return bySpan
  return meta.height
}
