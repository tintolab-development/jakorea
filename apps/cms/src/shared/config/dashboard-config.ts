/**
 * 권한별 대시보드 위젯 구성 설정
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 */

import type { UserRole } from '@/types/user'

/**
 * 대시보드 위젯 타입
 */
export type DashboardWidgetType =
  | 'pending-actions-alert' // 즉시 처리 필요 작업
  | 'overall-statistics-cards' // 전체 통계 카드 (프로그램, 신청, 매칭, 정산)
  | 'monthly-settlement-card' // 월별 정산 현황
  | 'monthly-application-card' // 월별 신청 현황
  | 'active-program-card' // 활성 프로그램
  | 'instructor-count-card' // 등록된 강사 수
  | 'unified-activity-feed' // 통합 활동 피드
  | 'my-activity-summary' // 본인 활동 요약 (강사/봉사자)
  | 'my-application-summary' // 본인 신청 현황 (수강자)
  | 'upcoming-schedules-list' // 예정된 일정 목록
  | 'pending-tasks-list' // 대기 중인 작업 목록

/**
 * 대시보드 위젯 설정
 */
export interface DashboardWidgetConfig {
  type: DashboardWidgetType
  allowedRoles?: UserRole[] // 허용된 권한 목록 (없으면 모든 권한 허용)
  colSpan?: number // Ant Design Col span (기본값: 6)
  order?: number // 표시 순서 (낮을수록 먼저 표시)
}

/**
 * 권한별 대시보드 위젯 구성
 */
const dashboardWidgets: Record<UserRole, DashboardWidgetConfig[]> = {
  // 관리자: 전체 통계 및 현황
  ADMIN: [
    { type: 'pending-actions-alert', colSpan: 24, order: 1 },
    { type: 'overall-statistics-cards', colSpan: 24, order: 2 },
    { type: 'monthly-settlement-card', colSpan: 6, order: 3 },
    { type: 'monthly-application-card', colSpan: 6, order: 4 },
    { type: 'active-program-card', colSpan: 6, order: 5 },
    { type: 'instructor-count-card', colSpan: 6, order: 6 },
    { type: 'unified-activity-feed', colSpan: 24, order: 7 },
  ],
  // 강사: 본인 활동 요약
  INSTRUCTOR: [
    { type: 'my-activity-summary', colSpan: 24, order: 1 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 2 },
    { type: 'pending-tasks-list', colSpan: 12, order: 3 },
    { type: 'unified-activity-feed', colSpan: 24, order: 4 },
  ],
  // 봉사자: 본인 활동 요약
  VOLUNTEER: [
    { type: 'my-activity-summary', colSpan: 24, order: 1 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 2 },
    { type: 'pending-tasks-list', colSpan: 12, order: 3 },
    { type: 'unified-activity-feed', colSpan: 24, order: 4 },
  ],
  // 수강자: 본인 신청 현황
  STUDENT: [
    { type: 'my-application-summary', colSpan: 24, order: 1 },
    { type: 'unified-activity-feed', colSpan: 24, order: 2 },
  ],
}

/**
 * 사용자 권한에 따라 대시보드 위젯 목록 반환
 * @param userRole 사용자 권한
 * @returns 대시보드 위젯 설정 목록 (정렬됨)
 */
export function getDashboardWidgetsByRole(
  userRole: UserRole | null
): DashboardWidgetConfig[] {
  if (!userRole) {
    return []
  }

  const widgets = dashboardWidgets[userRole] || []
  // order 기준으로 정렬
  return [...widgets].sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * 특정 위젯 타입이 권한에 허용되는지 확인
 * @param widgetType 위젯 타입
 * @param userRole 사용자 권한
 * @returns 허용 여부
 */
export function isWidgetAllowed(
  widgetType: DashboardWidgetType,
  userRole: UserRole | null
): boolean {
  if (!userRole) {
    return false
  }

  const widgets = getDashboardWidgetsByRole(userRole)
  return widgets.some(widget => widget.type === widgetType)
}



