/**
 * Dashboard feature Public API (FSD)
 * 페이지는 이 진입점만 사용합니다.
 */

export { useDashboardData } from './model/use-dashboard-data'
export {
  useDashboardWidgetOrderStore,
  buildDefaultDisplayItemIds,
  buildDisplayItemsMeta,
  reorderToAvoidTopGap,
  type DisplayItemMeta,
  type DashboardWidgetOrderState,
} from './model/dashboard-widget-order-store'
export { SortableWidgetSlot } from './ui/sortable-widget-slot'
export { DashboardSettingsModal } from './ui/dashboard-settings-modal'
export { DashboardToolbar } from './ui/dashboard-toolbar'
export { DashboardWidgetRenderer } from './ui/dashboard-widget-renderer'
export type { DashboardWidgetRendererProps } from './ui/dashboard-widget-renderer'
export { useOverallStatistics } from './hooks/use-overall-statistics'
export { useInstructorActivity } from './hooks/use-instructor-activity'
export { useDashboardDnd } from './hooks/use-dashboard-dnd'
export { useDashboardLayout } from './hooks/use-dashboard-layout'
export type { UseDashboardLayoutResult } from './hooks/use-dashboard-layout'
export { getSlotHeight } from './lib/dashboard-slot-utils'
