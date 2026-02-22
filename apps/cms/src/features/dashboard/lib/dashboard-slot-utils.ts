/**
 * 대시보드 슬롯 유틸 (높이 등)
 * 비즈니스 로직: menu-shortcut / program-schedule 특수 높이 규칙 유지
 */

import type { DisplayItemMeta } from '@/features/dashboard/model/dashboard-widget-order-store'

export function getSlotHeight(
  id: string,
  effectiveColSpan: 12 | 24,
  meta: DisplayItemMeta
): number | undefined {
  if (id === 'menu-shortcut-widget') {
    return effectiveColSpan === 12 ? 338 : 202
  }
  if (id === 'program-schedule-widget') {
    return effectiveColSpan === 12 ? 338 : (meta.height ?? 360)
  }
  return meta.height
}
