/**
 * 대시보드 위젯 id → 렌더 함수 레지스트리 (switch 대체)
 * 위젯 컴포넌트는 lazy — 홈 초기 번들에 캘린더·문의·KPI 등을 넣지 않음.
 */

import { lazy } from 'react'
import type { DashboardWidgetType } from '@/shared/config/dashboard-config'
import {
  MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX,
  PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX,
} from '@/shared/config/dashboard-config'
import { programScheduleMorePath } from '@/features/dashboard/lib/dashboard-widget-links'
import { LazyWidget } from '@/features/dashboard/ui/lazy-widget'
import type { User } from '@/types/user'

const CustomerInquiryStatusWidget = lazy(() =>
  import('@/features/dashboard/ui/customer-inquiry-status-widget').then(m => ({
    default: m.CustomerInquiryStatusWidget,
  }))
)
const ProgramScheduleWidget = lazy(() =>
  import('@/features/dashboard/ui/program-schedule-widget').then(m => ({
    default: m.ProgramScheduleWidget,
  }))
)
const MenuShortcutWidget = lazy(() =>
  import('@/features/dashboard/ui/menu-shortcut-widget').then(m => ({
    default: m.MenuShortcutWidget,
  }))
)
const RecruitmentStatusWidget = lazy(() =>
  import('@/features/dashboard/ui/recruitment-status-widget').then(m => ({
    default: m.RecruitmentStatusWidget,
  }))
)
const KpiAchievementWidget = lazy(() =>
  import('@/features/dashboard/ui/kpi-achievement-widget').then(m => ({
    default: m.KpiAchievementWidget,
  }))
)
const LogAlertsWidget = lazy(() =>
  import('@/features/dashboard/ui/log-alerts-widget').then(m => ({
    default: m.LogAlertsWidget,
  }))
)

export interface DashboardWidgetRenderProps {
  /** 부모 슬롯의 최종 너비. 위젯 내부 감시자 없이 테이블·캘린더 표시를 결정한다. */
  isHalfColumn?: boolean
  /** 관리자 프로그램 일정 위젯 ACL */
  user?: Omit<User, 'password'> | null
}

export type DashboardWidgetRenderFn = (props: DashboardWidgetRenderProps) => React.ReactNode

/** 구현된 위젯만 등록. 미등록 id는 DashboardWidgetRenderer에서 null */
export const DASHBOARD_WIDGET_REGISTRY: Partial<
  Record<DashboardWidgetType, DashboardWidgetRenderFn>
> = {
  'customer-inquiry-status-widget': p => (
    <LazyWidget height={338}>
      <CustomerInquiryStatusWidget isHalfColumn={p.isHalfColumn} />
    </LazyWidget>
  ),
  'program-schedule-general-widget': p => (
    <LazyWidget height={PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX}>
      <ProgramScheduleWidget
        variant="general"
        widgetKey="program-schedule-general-widget"
        title="일반 프로그램 일정"
        viewAllPath={programScheduleMorePath('general')}
        user={p.user}
        isHalfColumn={p.isHalfColumn}
      />
    </LazyWidget>
  ),
  'program-schedule-company-school-widget': p => (
    <LazyWidget height={PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX}>
      <ProgramScheduleWidget
        variant="company_school"
        widgetKey="program-schedule-company-school-widget"
        title="1사1교 프로그램 일정"
        viewAllPath={programScheduleMorePath('company_school')}
        user={p.user}
        isHalfColumn={p.isHalfColumn}
      />
    </LazyWidget>
  ),
  'program-schedule-ujat-widget': p => (
    <LazyWidget height={PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX}>
      <ProgramScheduleWidget
        variant="ujat"
        widgetKey="program-schedule-ujat-widget"
        title="UJAT 프로그램 일정"
        viewAllPath={programScheduleMorePath('ujat')}
        user={p.user}
        isHalfColumn={p.isHalfColumn}
      />
    </LazyWidget>
  ),
  'program-schedule-gemini-widget': p => (
    <LazyWidget height={PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX}>
      <ProgramScheduleWidget
        variant="gemini"
        widgetKey="program-schedule-gemini-widget"
        title="Gemini 프로그램 일정"
        viewAllPath={programScheduleMorePath('gemini')}
        user={p.user}
        isHalfColumn={p.isHalfColumn}
      />
    </LazyWidget>
  ),
  'program-schedule-trained-teacher-widget': p => (
    <LazyWidget height={PROGRAM_SCHEDULE_SLOT_HEIGHT_FULL_PX}>
      <ProgramScheduleWidget
        variant="trained_teacher"
        widgetKey="program-schedule-trained-teacher-widget"
        title="교육받은 교사 프로그램 일정"
        viewAllPath={programScheduleMorePath('trained_teacher')}
        user={p.user}
        isHalfColumn={p.isHalfColumn}
      />
    </LazyWidget>
  ),
  'menu-shortcut-widget': () => (
    <LazyWidget height={MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX}>
      <MenuShortcutWidget />
    </LazyWidget>
  ),
  'recruitment-status-widget': p => (
    <LazyWidget height={340}>
      <RecruitmentStatusWidget isHalfColumn={p.isHalfColumn} />
    </LazyWidget>
  ),
  'kpi-achievement-widget': () => (
    <LazyWidget>
      <KpiAchievementWidget />
    </LazyWidget>
  ),
  'log-alerts-widget': () => (
    <LazyWidget height={338}>
      <LogAlertsWidget />
    </LazyWidget>
  ),
}
