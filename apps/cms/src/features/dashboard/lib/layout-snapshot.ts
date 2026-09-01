/**
 * 역할별 위젯 순서·너비 스냅샷 — layout persist skip 비교용
 */

import { useDashboardWidgetOrderStore } from '@/features/dashboard/model/dashboard-widget-order-store'

export interface DashboardLayoutSnapshot {
  orderedWidgetIds: string[]
  widgetWidths: Record<string, 12 | 24>
}

export function snapshotDashboardLayoutForRole(role: string): DashboardLayoutSnapshot {
  const layout = useDashboardWidgetOrderStore.getState()
  const widths = layout.widthByRole[role] ?? {}
  const sortedWidths: Record<string, 12 | 24> = {}
  for (const key of Object.keys(widths).sort()) {
    const value = widths[key]
    if (value === 12 || value === 24) sortedWidths[key] = value
  }
  return {
    orderedWidgetIds: layout.orderByRole[role] ?? [],
    widgetWidths: sortedWidths,
  }
}

export function serializeDashboardLayoutSnapshot(snapshot: DashboardLayoutSnapshot): string {
  return JSON.stringify(snapshot)
}

export function shouldSkipLayoutPersist(
  previousSerialized: string | null,
  nextSnapshot: DashboardLayoutSnapshot
): boolean {
  return previousSerialized === serializeDashboardLayoutSnapshot(nextSnapshot)
}
