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
export { useDashboardHome } from './hooks/use-dashboard-home'
export { useDashboardNotificationCount } from './hooks/use-dashboard-notification-count'
export { useRecruitmentStatusList } from './hooks/use-recruitment-status-list'
export { useKpiAchievementList } from './hooks/use-kpi-achievement-list'
export { useProgramInquiryStatusList } from './hooks/use-program-inquiry-status-list'
export { useDashboardProgramSchedules } from './hooks/use-dashboard-program-schedules'
export { useDashboardProgramOptions } from './hooks/use-dashboard-program-options'
export { useDashboardShortcuts } from './hooks/use-dashboard-shortcuts'
export { useDashboardLogAlerts } from './hooks/use-dashboard-log-alerts'
export { useDashboardPreferences, useSaveDashboardPreferences } from './hooks/use-dashboard-preferences'
export {
  useDashboardQueryScope,
  useDashboardRemoteQueryEnabled,
} from './hooks/use-dashboard-query-scope'
export { clearDashboardQueryCache } from './api/clear-dashboard-query-cache'
export { shouldUseDashboardRemoteApi } from './api/admin-dashboard-service'
export { useDashboardDnd } from './hooks/use-dashboard-dnd'
export { useDashboardLayout } from './hooks/use-dashboard-layout'
export type { UseDashboardLayoutResult } from './hooks/use-dashboard-layout'
export { getSlotHeight } from './lib/dashboard-slot-utils'
export { dashboardQueryKeys } from './api/dashboard-query-keys'
