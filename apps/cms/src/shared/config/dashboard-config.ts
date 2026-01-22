/**
 * 권한별 대시보드 위젯 구성 설정
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 0.1.1: 역할 체계 재정의 (STUDENT → INDIVIDUAL, SCHOOL 추가)
 */

import type { UserRole } from '@/types/user'

/**
 * 대시보드 위젯 타입
 */
export type DashboardWidgetType =
  | 'pending-actions-alert' // 즉시 처리 필요 작업
  | 'overall-statistics-cards' // 전체 통계 카드 (프로그램, 신청, 매칭, 정산)
  | 'overall-program-progress-card' // 전체 강의 진행 현황 (신청 완료, 진행 예정, 진행 중, 진행 완료)
  | 'program-progress-widget' // Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
  | 'monthly-settlement-card' // 월별 정산 현황
  | 'monthly-application-card' // 월별 신청 현황
  | 'active-program-card' // 활성 프로그램
  | 'instructor-count-card' // 등록된 강사 수
  | 'notification-widget' // 알림 위젯
  | 'unified-activity-feed' // 통합 활동 피드
  | 'my-activity-summary' // 본인 활동 요약 (강사/봉사자)
  | 'my-application-summary' // 본인 신청 현황 (수강자)
  | 'upcoming-schedules-list' // 예정된 일정 목록
  | 'pending-tasks-list' // 대기 중인 작업 목록
  | 'my-volunteer-activity-summary' // 본인 활동 요약 (봉사자)
  | 'volunteer-pending-tasks-list' // 대기 중인 작업 목록 (봉사자)
  | 'pending-applications-card' // Phase 4.5: 대기 중인 신청 카드
  | 'pending-matchings-card' // Phase 4.5: 대기 중인 매칭 카드
  | 'pending-settlements-card' // Phase 4.5: 대기 중인 정산 카드

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
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'program-progress-widget', colSpan: 24, order: 2 },
    { type: 'pending-applications-card', colSpan: 8, order: 3 },
    { type: 'pending-matchings-card', colSpan: 8, order: 4 },
    { type: 'pending-settlements-card', colSpan: 8, order: 5 },
    { type: 'overall-statistics-cards', colSpan: 24, order: 6 },
    { type: 'monthly-settlement-card', colSpan: 6, order: 7 },
    { type: 'monthly-application-card', colSpan: 6, order: 8 },
    { type: 'active-program-card', colSpan: 6, order: 9 },
    { type: 'instructor-count-card', colSpan: 6, order: 10 },
    { type: 'unified-activity-feed', colSpan: 24, order: 11 },
  ],
  // 강사: 본인 활동 요약
  INSTRUCTOR: [
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'my-activity-summary', colSpan: 24, order: 2 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 3 },
    { type: 'pending-tasks-list', colSpan: 12, order: 4 },
    { type: 'unified-activity-feed', colSpan: 24, order: 5 },
  ],
  // 개인(참여자): 본인 신청 + 봉사단 활동 요약
  INDIVIDUAL: [
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'my-volunteer-activity-summary', colSpan: 24, order: 2 },
    { type: 'my-application-summary', colSpan: 24, order: 3 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 4 },
    { type: 'volunteer-pending-tasks-list', colSpan: 12, order: 5 },
    { type: 'unified-activity-feed', colSpan: 24, order: 6 },
  ],
  // 학교: 학교 단위 신청 및 진행 상황
  SCHOOL: [
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'my-application-summary', colSpan: 24, order: 2 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 3 },
    { type: 'pending-tasks-list', colSpan: 12, order: 4 },
    { type: 'unified-activity-feed', colSpan: 24, order: 5 },
  ],
  // 하위 호환성: STUDENT, VOLUNTEER
  STUDENT: [
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'my-volunteer-activity-summary', colSpan: 24, order: 2 },
    { type: 'my-application-summary', colSpan: 24, order: 3 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 4 },
    { type: 'volunteer-pending-tasks-list', colSpan: 12, order: 5 },
    { type: 'unified-activity-feed', colSpan: 24, order: 6 },
  ],
  VOLUNTEER: [
    { type: 'notification-widget', colSpan: 24, order: 1 },
    { type: 'my-volunteer-activity-summary', colSpan: 24, order: 2 },
    { type: 'upcoming-schedules-list', colSpan: 12, order: 3 },
    { type: 'volunteer-pending-tasks-list', colSpan: 12, order: 4 },
    { type: 'unified-activity-feed', colSpan: 24, order: 5 },
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



