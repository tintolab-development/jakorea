/**
 * 드래그 중 전체 위젯(테이블·캘린더)을 복제하지 않는 가벼운 overlay 셸
 */

import { WidgetTitleWithHandle } from '@/features/dashboard/ui/widget-title-with-handle'

const OVERLAY_TITLE_BY_WIDGET_ID: Record<string, string> = {
  'menu-shortcut-widget': '메뉴 바로가기',
  'program-schedule-general-widget': '프로그램 일정',
  'program-schedule-company-school-widget': '프로그램 일정',
  'program-schedule-ujat-widget': '프로그램 일정',
  'program-schedule-gemini-widget': '프로그램 일정',
  'recruitment-status-widget': '모집 신청 현황',
  'customer-inquiry-status-widget': '프로그램 별 문의 현황',
  'kpi-achievement-widget': '사업 별 KPI 대비 달성률',
  'notification-widget': '알림 리스트',
  'log-alerts-widget': '로그 알림',
}

export function getDashboardWidgetOverlayTitle(widgetId: string): string {
  return OVERLAY_TITLE_BY_WIDGET_ID[widgetId] ?? '위젯'
}

export function DashboardWidgetDragOverlayShell({
  widgetId,
  width,
  height,
}: {
  widgetId: string
  width?: number
  height?: number
}) {
  return (
    <div
      className="dashboard-widget-drag-overlay"
      style={
        width && height
          ? {
              width,
              height,
              maxWidth: width,
            }
          : undefined
      }
    >
      <div className="dashboard-widget-slot dashboard-widget-drag-overlay__slot">
        <WidgetTitleWithHandle>
          <span className="widget-card-title">{getDashboardWidgetOverlayTitle(widgetId)}</span>
        </WidgetTitleWithHandle>
      </div>
    </div>
  )
}
