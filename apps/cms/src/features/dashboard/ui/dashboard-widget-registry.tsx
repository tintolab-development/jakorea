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
import { DashboardWidgetSkeleton } from '@/features/dashboard/ui/dashboard-widget-skeleton'
import { LazyWidget } from '@/features/dashboard/ui/lazy-widget'
import type { OverallStatistics } from '@/features/dashboard/api/statistics-service'
import type { InstructorActivitySummary } from '@/features/dashboard/api/instructor-activity-service'
import type { User } from '@/types/user'
import { StatisticsCard } from '@/features/dashboard/ui/statistics-card'
import { UserOutlined } from '@ant-design/icons'

const PendingActionsAlert = lazy(() =>
  import('@/features/dashboard/ui/pending-actions-alert').then(m => ({
    default: m.PendingActionsAlert,
  }))
)
const OverallStatisticsCards = lazy(() =>
  import('@/features/dashboard/ui/overall-statistics-cards').then(m => ({
    default: m.OverallStatisticsCards,
  }))
)
const MonthlySettlementCard = lazy(() =>
  import('@/features/dashboard/ui/monthly-settlement-card').then(m => ({
    default: m.MonthlySettlementCard,
  }))
)
const MonthlyApplicationCard = lazy(() =>
  import('@/features/dashboard/ui/monthly-application-card').then(m => ({
    default: m.MonthlyApplicationCard,
  }))
)
const ActiveProgramCard = lazy(() =>
  import('@/features/dashboard/ui/active-program-card').then(m => ({
    default: m.ActiveProgramCard,
  }))
)
const UnifiedActivityFeed = lazy(() =>
  import('@/features/dashboard/ui/unified-activity-feed').then(m => ({
    default: m.UnifiedActivityFeed,
  }))
)
const MyActivitySummary = lazy(() =>
  import('@/features/dashboard/ui/my-activity-summary').then(m => ({
    default: m.MyActivitySummary,
  }))
)
const MyVolunteerActivitySummary = lazy(() =>
  import('@/features/dashboard/ui/my-volunteer-activity-summary').then(m => ({
    default: m.MyVolunteerActivitySummary,
  }))
)
const MyApplicationSummary = lazy(() =>
  import('@/features/dashboard/ui/my-application-summary').then(m => ({
    default: m.MyApplicationSummary,
  }))
)
const UpcomingSchedulesList = lazy(() =>
  import('@/features/dashboard/ui/upcoming-schedules-list').then(m => ({
    default: m.UpcomingSchedulesList,
  }))
)
const PendingTasksList = lazy(() =>
  import('@/features/dashboard/ui/pending-tasks-list').then(m => ({
    default: m.PendingTasksList,
  }))
)
const VolunteerPendingTasksList = lazy(() =>
  import('@/features/dashboard/ui/volunteer-pending-tasks-list').then(m => ({
    default: m.VolunteerPendingTasksList,
  }))
)
const OverallProgramProgressCard = lazy(() =>
  import('@/features/dashboard/ui/overall-program-progress-card').then(m => ({
    default: m.OverallProgramProgressCard,
  }))
)
const ProgramProgressTabsTable = lazy(() =>
  import('@/features/dashboard/ui/program-progress-tabs-table').then(m => ({
    default: m.ProgramProgressTabsTable,
  }))
)
const PendingApplicationsCard = lazy(() =>
  import('@/features/dashboard/ui/pending-applications-card').then(m => ({
    default: m.PendingApplicationsCard,
  }))
)
const PendingMatchingsCard = lazy(() =>
  import('@/features/dashboard/ui/pending-matchings-card').then(m => ({
    default: m.PendingMatchingsCard,
  }))
)
const PendingSettlementsCard = lazy(() =>
  import('@/features/dashboard/ui/pending-settlements-card').then(m => ({
    default: m.PendingSettlementsCard,
  }))
)
const PendingActionsRow = lazy(() =>
  import('@/features/dashboard/ui/pending-actions-row').then(m => ({
    default: m.PendingActionsRow,
  }))
)
const NotificationWidget = lazy(() =>
  import('@/features/dashboard/ui/notification-widget').then(m => ({
    default: m.NotificationWidget,
  }))
)
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
  overallStatistics: OverallStatistics | null
  statisticsLoading: boolean
  instructorActivity: InstructorActivitySummary | null
  instructorActivityLoading: boolean
  instructorCount: number
  /** 관리자 프로그램 일정 위젯 ACL */
  user?: Omit<User, 'password'> | null
}

export type DashboardWidgetRenderFn = (props: DashboardWidgetRenderProps) => React.ReactNode

function renderOverallStatisticsCards(p: DashboardWidgetRenderProps) {
  if (!p.overallStatistics) {
    return <DashboardWidgetSkeleton loading={p.statisticsLoading} height={150} />
  }
  return (
    <LazyWidget height={150}>
      <OverallStatisticsCards statistics={p.overallStatistics} loading={p.statisticsLoading} />
    </LazyWidget>
  )
}

function renderInstructorCountCard(p: DashboardWidgetRenderProps) {
  return (
    <StatisticsCard
      title="등록된 강사"
      value={p.instructorCount}
      prefix={<UserOutlined />}
      suffix="명"
      to="/users/list?kind=instructors"
    />
  )
}

function renderUpcomingSchedulesList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <LazyWidget>
      <UpcomingSchedulesList
        schedules={p.instructorActivity.schedules.upcoming}
        loading={p.instructorActivityLoading}
      />
    </LazyWidget>
  )
}

function renderPendingTasksList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <LazyWidget>
      <PendingTasksList
        reportPending={p.instructorActivity.pendingTasks.reportPending}
        settlementPending={p.instructorActivity.pendingTasks.settlementPending}
        settlementTasks={p.instructorActivity.pendingTasks.settlementTasks}
        loading={p.instructorActivityLoading}
      />
    </LazyWidget>
  )
}

function renderVolunteerPendingTasksList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <LazyWidget>
      <VolunteerPendingTasksList
        reportPending={p.instructorActivity.pendingTasks.reportPending}
        reportTasks={[]}
        loading={p.instructorActivityLoading}
      />
    </LazyWidget>
  )
}

/** 구현된 위젯만 등록. 미등록 id는 DashboardWidgetRenderer에서 null */
export const DASHBOARD_WIDGET_REGISTRY: Partial<
  Record<DashboardWidgetType, DashboardWidgetRenderFn>
> = {
  'pending-actions-alert': () => (
    <LazyWidget>
      <PendingActionsAlert />
    </LazyWidget>
  ),
  'overall-statistics-cards': renderOverallStatisticsCards,
  'overall-program-progress-card': () => (
    <LazyWidget>
      <OverallProgramProgressCard />
    </LazyWidget>
  ),
  'program-progress-tabs-table': () => (
    <LazyWidget>
      <ProgramProgressTabsTable />
    </LazyWidget>
  ),
  'pending-actions-row': () => (
    <LazyWidget>
      <PendingActionsRow />
    </LazyWidget>
  ),
  'pending-applications-card': () => (
    <LazyWidget>
      <PendingApplicationsCard />
    </LazyWidget>
  ),
  'pending-matchings-card': () => (
    <LazyWidget>
      <PendingMatchingsCard />
    </LazyWidget>
  ),
  'pending-settlements-card': () => (
    <LazyWidget>
      <PendingSettlementsCard />
    </LazyWidget>
  ),
  'monthly-settlement-card': () => (
    <LazyWidget>
      <MonthlySettlementCard />
    </LazyWidget>
  ),
  'monthly-application-card': () => (
    <LazyWidget>
      <MonthlyApplicationCard />
    </LazyWidget>
  ),
  'active-program-card': () => (
    <LazyWidget>
      <ActiveProgramCard />
    </LazyWidget>
  ),
  'instructor-count-card': renderInstructorCountCard,
  'unified-activity-feed': () => (
    <LazyWidget>
      <UnifiedActivityFeed pageSize={10} />
    </LazyWidget>
  ),
  'my-activity-summary': () => (
    <LazyWidget>
      <MyActivitySummary />
    </LazyWidget>
  ),
  'my-volunteer-activity-summary': () => (
    <LazyWidget>
      <MyVolunteerActivitySummary />
    </LazyWidget>
  ),
  'my-application-summary': () => (
    <LazyWidget>
      <MyApplicationSummary />
    </LazyWidget>
  ),
  'upcoming-schedules-list': renderUpcomingSchedulesList,
  'pending-tasks-list': renderPendingTasksList,
  'volunteer-pending-tasks-list': renderVolunteerPendingTasksList,
  'notification-widget': () => (
    <LazyWidget>
      <NotificationWidget />
    </LazyWidget>
  ),
  'customer-inquiry-status-widget': () => (
    <LazyWidget height={338}>
      <CustomerInquiryStatusWidget />
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
      />
    </LazyWidget>
  ),
  'menu-shortcut-widget': () => (
    <LazyWidget height={MENU_SHORTCUT_SLOT_HEIGHT_FULL_PX}>
      <MenuShortcutWidget />
    </LazyWidget>
  ),
  'recruitment-status-widget': () => (
    <LazyWidget height={340}>
      <RecruitmentStatusWidget />
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
