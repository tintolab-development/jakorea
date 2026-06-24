/**
 * 대시보드 React Query key — Swagger `프론트 조회 키`와 정렬
 */
export type DashboardQueryScope = 'remote' | 'mock'

export const dashboardQueryKeys = {
  all: ['cms', 'dashboard'] as const,
  /** mock ↔ remote JWT 캐시 분리 */
  scope: (source: DashboardQueryScope) => [...dashboardQueryKeys.all, source] as const,
  /** Swagger: get_admin_dashboard_home */
  home: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_home'] as const,
  /** Swagger: get_admin_dashboard_notifications_count */
  notificationCount: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_notifications_count'] as const,
  /** Swagger: get_admin_dashboard_recruitments */
  recruitments: (source: DashboardQueryScope, params: Record<string, string>) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_recruitments', params] as const,
  /** Swagger: get_admin_dashboard_kpi-progress */
  kpiProgress: (source: DashboardQueryScope, params: Record<string, string>) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_kpi-progress', params] as const,
  /** Swagger: get_admin_dashboard_program-inquiries */
  programInquiries: (source: DashboardQueryScope, params: Record<string, string>) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_program-inquiries', params] as const,
  /** Swagger: get_admin_dashboard_program-schedules */
  programSchedules: (source: DashboardQueryScope, params: Record<string, string>) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_program-schedules', params] as const,
  /** Swagger: get_admin_dashboard_preferences */
  preferences: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_me_dashboard_preferences'] as const,
  /** Swagger: get_me_dashboard_shortcut-badges */
  shortcutBadges: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_me_dashboard_shortcut_badges'] as const,
  /** Swagger: get_admin_notifications */
  notifications: (source: DashboardQueryScope, params: Record<string, string | number | boolean>) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_notifications', params] as const,
  /** Swagger: get_admin_dashboard_widgets_widgetKey_program-filters (options via recruitments) */
  programOptions: (source: DashboardQueryScope, widgetKey: string) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_program_options', widgetKey] as const,
  /** Swagger: get_admin_dashboard_shortcuts */
  shortcuts: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_shortcuts'] as const,
  /** Swagger: get_admin_dashboard_log-alerts */
  logAlerts: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'get_admin_dashboard_log-alerts'] as const,
  overallStatistics: (source: DashboardQueryScope) =>
    [...dashboardQueryKeys.scope(source), 'overall-statistics'] as const,
  instructorActivity: (source: DashboardQueryScope, instructorId: string | undefined) =>
    [...dashboardQueryKeys.scope(source), 'instructor-activity', instructorId ?? 'none'] as const,
} as const

/** 뮤테이션 후 위젯 캐시 일괄 무효화 */
export const dashboardInvalidateKeys = {
  all: dashboardQueryKeys.all,
  widgets: () => [...dashboardQueryKeys.all] as const,
} as const
