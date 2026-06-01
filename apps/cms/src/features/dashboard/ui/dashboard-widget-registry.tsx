/**
 * 대시보드 위젯 id → 렌더 함수 레지스트리 (switch 대체)
 */

import { Card, Statistic } from 'antd'
import type { DashboardWidgetType } from '@/shared/config/dashboard-config'
import { DashboardWidgetSkeleton } from '@/features/dashboard/ui/dashboard-widget-skeleton'
import type { OverallStatistics } from '@/features/dashboard/api/statistics-service'
import type { InstructorActivitySummary } from '@/features/dashboard/api/instructor-activity-service'
import { PendingActionsAlert } from '@/features/dashboard/ui/pending-actions-alert'
import { OverallStatisticsCards } from '@/features/dashboard/ui/overall-statistics-cards'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'
import { MyActivitySummary } from '@/features/dashboard/ui/my-activity-summary'
import { MyVolunteerActivitySummary } from '@/features/dashboard/ui/my-volunteer-activity-summary'
import { MyApplicationSummary } from '@/features/dashboard/ui/my-application-summary'
import { UpcomingSchedulesList } from '@/features/dashboard/ui/upcoming-schedules-list'
import { PendingTasksList } from '@/features/dashboard/ui/pending-tasks-list'
import { VolunteerPendingTasksList } from '@/features/dashboard/ui/volunteer-pending-tasks-list'
import { OverallProgramProgressCard } from '@/features/dashboard/ui/overall-program-progress-card'
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
import { PendingApplicationsCard } from '@/features/dashboard/ui/pending-applications-card'
import { PendingMatchingsCard } from '@/features/dashboard/ui/pending-matchings-card'
import { PendingSettlementsCard } from '@/features/dashboard/ui/pending-settlements-card'
import { PendingActionsRow } from '@/features/dashboard/ui/pending-actions-row'
import { NotificationWidget } from '@/features/dashboard/ui/notification-widget'
import { CustomerInquiryStatusWidget } from '@/features/dashboard/ui/customer-inquiry-status-widget'
import type { User } from '@/types/user'
import { PROGRAM_SCHEDULE_WIDGET_KEYS } from '@/data/mock'
import { ProgramScheduleWidget } from '@/features/dashboard/ui/program-schedule-widget'
import { MenuShortcutWidget } from '@/features/dashboard/ui/menu-shortcut-widget'
import { RecruitmentStatusWidget } from '@/features/dashboard/ui/recruitment-status-widget'
import { KpiAchievementWidget } from '@/features/dashboard/ui/kpi-achievement-widget'

export interface DashboardWidgetRenderProps {
  overallStatistics: OverallStatistics | null
  statisticsLoading: boolean
  instructorActivity: InstructorActivitySummary | null
  instructorActivityLoading: boolean
  instructorCount: number
  onInstructorCardClick: () => void
  /** 관리자 프로그램 일정 위젯 ACL */
  user?: Omit<User, 'password'> | null
}

export type DashboardWidgetRenderFn = (props: DashboardWidgetRenderProps) => React.ReactNode

function renderOverallStatisticsCards(p: DashboardWidgetRenderProps) {
  if (!p.overallStatistics) {
    return <DashboardWidgetSkeleton loading={p.statisticsLoading} height={150} />
  }
  return (
    <OverallStatisticsCards statistics={p.overallStatistics} loading={p.statisticsLoading} />
  )
}

function renderInstructorCountCard(p: DashboardWidgetRenderProps) {
  return (
    <Card hoverable onClick={p.onInstructorCardClick} style={{ height: '100%', cursor: 'pointer' }}>
      <Statistic
        title="등록된 강사"
        value={p.instructorCount}
        suffix="명"
        valueStyle={{ color: '#000000', fontWeight: 'bold' }}
      />
    </Card>
  )
}

function renderUpcomingSchedulesList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <UpcomingSchedulesList
      schedules={p.instructorActivity.schedules.upcoming}
      loading={p.instructorActivityLoading}
    />
  )
}

function renderPendingTasksList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <PendingTasksList
      reportPending={p.instructorActivity.pendingTasks.reportPending}
      settlementPending={p.instructorActivity.pendingTasks.settlementPending}
      settlementTasks={p.instructorActivity.pendingTasks.settlementTasks}
      loading={p.instructorActivityLoading}
    />
  )
}

function renderVolunteerPendingTasksList(p: DashboardWidgetRenderProps) {
  if (!p.instructorActivity) {
    return <DashboardWidgetSkeleton loading={p.instructorActivityLoading} />
  }
  return (
    <VolunteerPendingTasksList
      reportPending={p.instructorActivity.pendingTasks.reportPending}
      reportTasks={[]}
      loading={p.instructorActivityLoading}
    />
  )
}

/** 구현된 위젯만 등록. 미등록 id는 DashboardWidgetRenderer에서 null */
export const DASHBOARD_WIDGET_REGISTRY: Partial<Record<DashboardWidgetType, DashboardWidgetRenderFn>> = {
  'pending-actions-alert': () => <PendingActionsAlert />,
  'overall-statistics-cards': renderOverallStatisticsCards,
  'overall-program-progress-card': () => <OverallProgramProgressCard />,
  'program-progress-tabs-table': () => <ProgramProgressTabsTable />,
  'pending-actions-row': () => <PendingActionsRow />,
  'pending-applications-card': () => <PendingApplicationsCard />,
  'pending-matchings-card': () => <PendingMatchingsCard />,
  'pending-settlements-card': () => <PendingSettlementsCard />,
  'monthly-settlement-card': () => <MonthlySettlementCard />,
  'monthly-application-card': () => <MonthlyApplicationCard />,
  'active-program-card': () => <ActiveProgramCard />,
  'instructor-count-card': renderInstructorCountCard,
  'unified-activity-feed': () => <UnifiedActivityFeed pageSize={10} />,
  'my-activity-summary': () => <MyActivitySummary />,
  'my-volunteer-activity-summary': () => <MyVolunteerActivitySummary />,
  'my-application-summary': () => <MyApplicationSummary />,
  'upcoming-schedules-list': renderUpcomingSchedulesList,
  'pending-tasks-list': renderPendingTasksList,
  'volunteer-pending-tasks-list': renderVolunteerPendingTasksList,
  'notification-widget': () => <NotificationWidget />,
  'customer-inquiry-status-widget': () => <CustomerInquiryStatusWidget />,
  'program-schedule-general-widget': p => (
    <ProgramScheduleWidget
      variant="general"
      widgetKey={PROGRAM_SCHEDULE_WIDGET_KEYS.general}
      title="일반 프로그램 일정"
      viewAllPath="/programs/general"
      user={p.user}
    />
  ),
  'program-schedule-company-school-widget': p => (
    <ProgramScheduleWidget
      variant="company_school"
      widgetKey={PROGRAM_SCHEDULE_WIDGET_KEYS.company_school}
      title="1사1교 프로그램 일정"
      viewAllPath="/programs/company-school"
      user={p.user}
    />
  ),
  'program-schedule-ujat-widget': p => (
    <ProgramScheduleWidget
      variant="ujat"
      widgetKey={PROGRAM_SCHEDULE_WIDGET_KEYS.ujat}
      title="UJAT 프로그램 일정"
      viewAllPath="/programs/ujat"
      user={p.user}
    />
  ),
  'program-schedule-gemini-widget': p => (
    <ProgramScheduleWidget
      variant="gemini"
      widgetKey={PROGRAM_SCHEDULE_WIDGET_KEYS.gemini}
      title="Gemini 프로그램 일정"
      viewAllPath="/programs/gemini"
      user={p.user}
    />
  ),
  'menu-shortcut-widget': () => <MenuShortcutWidget />,
  'recruitment-status-widget': () => <RecruitmentStatusWidget />,
  'kpi-achievement-widget': () => <KpiAchievementWidget />,
}
