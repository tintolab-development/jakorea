/**
 * 관리자 대시보드 위젯 구성 설정
 */

import type { User, UserRole } from '@/types/user'
import {
  type ProgramScheduleKind,
  getProgramScheduleKindsForAdminUser,
} from '@/features/dashboard/model/program-schedule-categories'

/**
 * 대시보드 위젯 타입
 */
export type DashboardWidgetType =
  | 'menu-shortcut-widget' // 메뉴 바로가기 위젯
  | 'program-schedule-general-widget' // 일반 프로그램 일정
  | 'program-schedule-company-school-widget' // 1사1교 프로그램 일정
  | 'program-schedule-ujat-widget' // UJAT 프로그램 일정
  | 'program-schedule-gemini-widget' // Gemini 프로그램 일정
  | 'recruitment-status-widget' // 모집 신청 현황 위젯
  | 'customer-inquiry-status-widget' // 고객 문의 현황 위젯
  | 'kpi-achievement-widget' // 사업 별 KPI 대비 달성률 위젯
  | 'log-alerts-widget' // MASTER 전용 로그 알림

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

/**
 * 메뉴 바로가기 로딩(Suspense) 자리 높이.
 * 100% 슬롯 자체는 고정 높이 없이 콘텐츠 높이(hug)를 따른다.
 */
export const MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX = 352 as const

/** 프로그램 일정 위젯 100% 너비(colSpan 24) 슬롯 높이 */
export const PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX = 376 as const

const EMPTY_PROGRAM_SCHEDULE_KINDS: ProgramScheduleKind[] = []

function programScheduleKindToWidgetType(kind: ProgramScheduleKind): DashboardWidgetType {
  switch (kind) {
    case 'general':
      return 'program-schedule-general-widget'
    case 'company_school':
      return 'program-schedule-company-school-widget'
    case 'ujat':
      return 'program-schedule-ujat-widget'
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
      // 100%: 고정 높이 없이 hug · 50%: SortableWidgetSlot 기본 400px(같은 줄 높이 정렬)
      type: 'menu-shortcut-widget',
      colSpan: 24,
      order: 0,
    },
    ...scheduleWidgets,
    { type: 'recruitment-status-widget', colSpan: 24, order: orderAfterSchedules, height: 400 },
    {
      type: 'customer-inquiry-status-widget',
      colSpan: 24,
      order: orderAfterSchedules + 1,
      height: 400,
    },
    // 100%: 고정 높이 없이 hug(KPI 항목 전체 노출) · 50%: SortableWidgetSlot 기본 400px
    { type: 'kpi-achievement-widget', colSpan: 24, order: orderAfterSchedules + 2 },
  ]
}

/**
 * remote GET 전에 mock ACL로 일정 위젯을 채우지 않는다.
 * null = 아직 없음(mock ACL 폴백), [] = 담당 유형 없음.
 */
export function assignedProgramTypesForWidgetLayout(
  assignedProgramTypes: ProgramScheduleKind[] | null,
  remote: boolean
): ProgramScheduleKind[] | null {
  if (remote && assignedProgramTypes == null) return EMPTY_PROGRAM_SCHEDULE_KINDS
  return assignedProgramTypes
}

/**
 * 로그인 사용자 기준 대시보드 위젯 (관리자는 assignedProgramTypes 또는 ACL로 일정 유형 필터)
 * 로그 알림 위젯은 백엔드 v9에서 API가 제거되어 홈에 붙이지 않는다.
 */
export function getDashboardWidgetsForUser(
  user: Omit<User, 'password'> | null,
  assignedProgramTypes?: ProgramScheduleKind[] | null
): DashboardWidgetConfig[] {
  if (!user?.role) {
    return []
  }
  if (user.role !== 'ADMIN') {
    return []
  }
  const kinds =
    assignedProgramTypes != null
      ? assignedProgramTypes
      : getProgramScheduleKindsForAdminUser(user)
  return buildAdminDashboardWidgets(kinds).sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * 권한별 대시보드 위젯 목록 (정렬됨). CMS 로그인은 관리자만 — 관리자 외 역할은 위젯 없음.
 * @param userRole 사용자 권한
 */
export function getDashboardWidgetsByRole(userRole: UserRole | null): DashboardWidgetConfig[] {
  if (userRole !== 'ADMIN') {
    return []
  }
  return buildAdminDashboardWidgets(['general']).sort((a, b) => (a.order || 0) - (b.order || 0))
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
