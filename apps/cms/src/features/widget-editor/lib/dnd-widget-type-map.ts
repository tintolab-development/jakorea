/**
 * DnD 전용 위젯 타입 매핑
 * 기존 레지스트리 위젯 키 → 3가지 레이아웃 타입 (FULL | TALL | NORMAL)
 * 매핑에 없으면 NORMAL 로 처리.
 */

export type DndWidgetType = 'FULL' | 'TALL' | 'NORMAL'

export const DND_WIDGET_TYPE_BY_KEY: Record<string, DndWidgetType> = {
  // ADMIN 등에서 자주 쓰이는 위젯
  'notification-widget': 'TALL',
  'customer-inquiry-status-widget': 'FULL',
  'program-schedule-widget': 'TALL',
  'program-progress-tabs-table': 'FULL',
  // 진행 현황 / 통계
  'overall-program-progress-card': 'FULL',
  'overall-statistics-cards': 'FULL',
  'unified-activity-feed': 'FULL',
  'pending-actions-row': 'FULL',
  // 본인 요약 / 활동
  'my-activity-summary': 'TALL',
  'my-volunteer-activity-summary': 'TALL',
  'my-application-summary': 'TALL',
  // 리스트 / 카드 (반폭)
  'upcoming-schedules-list': 'NORMAL',
  'pending-tasks-list': 'NORMAL',
  'volunteer-pending-tasks-list': 'NORMAL',
  'monthly-settlement-card': 'NORMAL',
  'monthly-application-card': 'NORMAL',
  'active-program-card': 'NORMAL',
  'pending-applications-card': 'NORMAL',
  'pending-matchings-card': 'NORMAL',
  'pending-settlements-card': 'NORMAL',
}

const DEFAULT_TYPE: DndWidgetType = 'NORMAL'

/** 2단 사용 시 338px 고정 높이 적용 제외 (사업 별 KPI 대비 달성률 등) */
export const KPI_WIDGET_KEYS: Set<string> = new Set(['overall-statistics-cards'])

export function isKpiWidgetKey(widgetKey: string): boolean {
  return KPI_WIDGET_KEYS.has(widgetKey)
}

/**
 * 위젯 키에 해당하는 DnD 타입 반환. 없으면 NORMAL.
 */
export function getDndWidgetType(widgetKey: string): DndWidgetType {
  return DND_WIDGET_TYPE_BY_KEY[widgetKey] ?? DEFAULT_TYPE
}
