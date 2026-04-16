/**
 * 권한별 대시보드 위젯 구성 설정
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 */

import type { User, UserRole } from '@/types/user'
import {
  type ProgramScheduleKind,
  getProgramScheduleKindsForAdminUser,
} from '@/data/mock'

/**
 * 대시보드 위젯 타입
 */
export type DashboardWidgetType =
  | 'pending-actions-alert' // 즉시 처리 필요 작업
  | 'overall-statistics-cards' // 전체 통계 카드 (프로그램, 신청, 매칭, 정산)
  | 'overall-program-progress-card' // 전체 강의 진행 현황 (신청 완료, 진행 예정, 진행 중, 진행 완료)
  | 'program-progress-widget' // Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계) — 임시 주석 처리됨
  | 'program-progress-tabs-table' // 전체 프로그램 진행 현황 (탭+테이블)
  | 'monthly-settlement-card' // 월별 정산 현황
  | 'monthly-application-card' // 월별 신청 현황
  | 'active-program-card' // 활성 프로그램
  | 'instructor-count-card' // 등록된 강사 수
  | 'notification-widget' // 알림 위젯
  | 'customer-inquiry-status-widget' // 고객 문의 현황 위젯
  | 'program-schedule-general-widget' // 일반 프로그램 일정
  | 'program-schedule-economy-widget' // 경제 교육 프로그램 일정
  | 'program-schedule-gemini-widget' // 제미나이 프로그램 일정
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
  | 'pending-actions-row' // 대기 중인 작업 Row (신청, 매칭, 정산을 한 레이어에)
  | 'menu-shortcut-widget' // 메뉴 바로가기 위젯
  | 'recruitment-status-widget' // 모집 신청 현황 위젯
  | 'kpi-achievement-widget' // 사업 별 KPI 대비 달성률 위젯

/** 슬롯 인라인 height(px). colSpan(12=50%, 24=100%)별. 미지정 시 SortableWidgetSlot·meta.height 규칙 */
export type DashboardWidgetSlotHeightPx = Partial<Record<12 | 24, number>>

/**
 * 대시보드 위젯 설정
 */
export interface DashboardWidgetConfig {
  type: DashboardWidgetType
  allowedRoles?: UserRole[] // 허용된 권한 목록 (없으면 모든 권한 허용)
  colSpan?: number // Ant Design Col span (기본값: 24)
  order?: number // 표시 순서 (낮을수록 먼저 표시)
  /** 위젯 고정 높이(px). 미지정 시 기본값 338px */
  height?: number
  /** 슬롯 높이 단일 소스: getSlotHeight가 우선 사용. 미지정이면 height·50% 기본값 등 */
  slotHeightPx?: DashboardWidgetSlotHeightPx
}

/** colSpan 12일 때 모든 위젯 슬롯 기본 높이 (SortableWidgetSlot) */
export const DASHBOARD_SLOT_HEIGHT_HALF_PX = 400 as const

/** 메뉴 바로가기 100% 슬롯 높이 — CSS `.menu-shortcut-widget` 슬롯 규칙과 동기화 */
export const MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX = 248 as const

/** 프로그램 일정 위젯 100% 너비(colSpan 24) 슬롯 높이 */
export const PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX = 383 as const

function programScheduleKindToWidgetType(kind: ProgramScheduleKind): DashboardWidgetType {
  switch (kind) {
    case 'general':
      return 'program-schedule-general-widget'
    case 'economy':
      return 'program-schedule-economy-widget'
    case 'gemini':
      return 'program-schedule-gemini-widget'
  }
}

/** 관리자 홈: 메뉴 바로가기 + (ACL별) 프로그램 일정 + 하단 위젯 */
export function buildAdminDashboardWidgets(scheduleKinds: ProgramScheduleKind[]): DashboardWidgetConfig[] {
  const scheduleWidgets: DashboardWidgetConfig[] = scheduleKinds.map((kind, index) => ({
    type: programScheduleKindToWidgetType(kind),
    colSpan: 24,
    order: 1 + index,
    height: PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX,
    slotHeightPx: { 12: 338, 24: PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX },
  }))
  const orderAfterSchedules = 1 + scheduleKinds.length
  return [
    {
      type: 'menu-shortcut-widget',
      colSpan: 24,
      order: 0,
      height: MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX,
      slotHeightPx: { 24: MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX },
    },
    ...scheduleWidgets,
    { type: 'recruitment-status-widget', colSpan: 24, order: orderAfterSchedules, height: 340 },
    {
      type: 'customer-inquiry-status-widget',
      colSpan: 24,
      order: orderAfterSchedules + 1,
      height: 338,
    },
    { type: 'kpi-achievement-widget', colSpan: 24, order: orderAfterSchedules + 2 },
  ]
}

/**
 * 로그인 사용자 기준 대시보드 위젯 (관리자는 ACL로 프로그램 일정 위젯 유형 필터)
 */
export function getDashboardWidgetsForUser(user: Omit<User, 'password'> | null): DashboardWidgetConfig[] {
  if (!user?.role) {
    return []
  }
  if (user.role !== 'ADMIN') {
    return getDashboardWidgetsByRole(user.role)
  }
  const kinds = getProgramScheduleKindsForAdminUser(user)
  return buildAdminDashboardWidgets(kinds).sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * 권한별 대시보드 위젯 구성 (ADMIN은 ACL 없이 마스터와 동일한 3종 일정 포함 — 기본 순서·폴백용)
 */
const dashboardWidgets: Record<Exclude<UserRole, 'ADMIN'>, DashboardWidgetConfig[]> = {
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
}

/**
 * 사용자 권한에 따라 대시보드 위젯 목록 반환
 * @param userRole 사용자 권한
 * @returns 대시보드 위젯 설정 목록 (정렬됨)
 */
export function getDashboardWidgetsByRole(userRole: UserRole | null): DashboardWidgetConfig[] {
  if (!userRole) {
    return []
  }

  if (userRole === 'ADMIN') {
    return buildAdminDashboardWidgets(['general', 'economy', 'gemini']).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    )
  }

  const widgets = dashboardWidgets[userRole] || []
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

/**
 * 너비 리사이즈(50% ↔ 100%)가 불가한 위젯 id 목록.
 * DnD 훅·대시보드 페이지에서 리사이즈 핸들 노출 여부 판단에 사용.
 */
export const WIDGET_IDS_NON_RESIZABLE: readonly string[] = ['kpi-achievement-widget']

/**
 * 위젯이 너비 리사이즈 가능한지 여부
 */
export function isWidgetResizable(widgetId: string): boolean {
  return !WIDGET_IDS_NON_RESIZABLE.includes(widgetId)
}
