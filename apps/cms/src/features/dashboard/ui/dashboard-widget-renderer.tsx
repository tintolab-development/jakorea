/**
 * 위젯 타입별 렌더링 (Dashboard 비즈니스 로직 유지, 페이지 컴포넌트 경량화)
 */

import { Card, Statistic } from 'antd'
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
import { ProgramScheduleWidget } from '@/features/dashboard/ui/program-schedule-widget'
import { MenuShortcutWidget } from '@/features/dashboard/ui/menu-shortcut-widget'
import { RecruitmentStatusWidget } from '@/features/dashboard/ui/recruitment-status-widget'
import { KpiAchievementWidget } from '@/features/dashboard/ui/kpi-achievement-widget'

export interface DashboardWidgetRendererProps {
  widgetType: string
  overallStatistics: OverallStatistics | null
  statisticsLoading: boolean
  instructorActivity: InstructorActivitySummary | null
  instructorActivityLoading: boolean
  instructorCount: number
  onInstructorCardClick: () => void
}

export function DashboardWidgetRenderer({
  widgetType,
  overallStatistics,
  statisticsLoading,
  instructorActivity,
  instructorActivityLoading,
  instructorCount,
  onInstructorCardClick,
}: DashboardWidgetRendererProps): React.ReactNode {
  switch (widgetType) {
    case 'pending-actions-alert':
      return <PendingActionsAlert />
    case 'overall-statistics-cards':
      if (!overallStatistics) {
        return (
          <Card loading={statisticsLoading}>
            <div style={{ height: 150 }} />
          </Card>
        )
      }
      return (
        <OverallStatisticsCards
          statistics={overallStatistics}
          loading={statisticsLoading}
        />
      )
    case 'overall-program-progress-card':
      return <OverallProgramProgressCard />
    case 'program-progress-tabs-table':
      return <ProgramProgressTabsTable />
    case 'pending-actions-row':
      return <PendingActionsRow />
    case 'pending-applications-card':
      return <PendingApplicationsCard />
    case 'pending-matchings-card':
      return <PendingMatchingsCard />
    case 'pending-settlements-card':
      return <PendingSettlementsCard />
    case 'monthly-settlement-card':
      return <MonthlySettlementCard />
    case 'monthly-application-card':
      return <MonthlyApplicationCard />
    case 'active-program-card':
      return <ActiveProgramCard />
    case 'instructor-count-card':
      return (
        <Card
          hoverable
          onClick={onInstructorCardClick}
          style={{ height: '100%', cursor: 'pointer' }}
        >
          <Statistic
            title="등록된 강사"
            value={instructorCount}
            suffix="명"
            valueStyle={{ color: '#000000', fontWeight: 'bold' }}
          />
        </Card>
      )
    case 'unified-activity-feed':
      return <UnifiedActivityFeed pageSize={10} />
    case 'my-activity-summary':
      return <MyActivitySummary />
    case 'my-volunteer-activity-summary':
      return <MyVolunteerActivitySummary />
    case 'my-application-summary':
      return <MyApplicationSummary />
    case 'upcoming-schedules-list':
      if (!instructorActivity) {
        return (
          <Card loading={instructorActivityLoading}>
            <div style={{ height: 200 }} />
          </Card>
        )
      }
      return (
        <UpcomingSchedulesList
          schedules={instructorActivity.schedules.upcoming}
          loading={instructorActivityLoading}
        />
      )
    case 'pending-tasks-list':
      if (!instructorActivity) {
        return (
          <Card loading={instructorActivityLoading}>
            <div style={{ height: 200 }} />
          </Card>
        )
      }
      return (
        <PendingTasksList
          reportPending={instructorActivity!.pendingTasks.reportPending}
          settlementPending={instructorActivity!.pendingTasks.settlementPending}
          settlementTasks={instructorActivity!.pendingTasks.settlementTasks}
          loading={instructorActivityLoading}
        />
      )
    case 'volunteer-pending-tasks-list':
      if (!instructorActivity) {
        return (
          <Card loading={instructorActivityLoading}>
            <div style={{ height: 200 }} />
          </Card>
        )
      }
      return (
        <VolunteerPendingTasksList
          reportPending={instructorActivity!.pendingTasks.reportPending}
          reportTasks={[]}
          loading={instructorActivityLoading}
        />
      )
    case 'notification-widget':
      return <NotificationWidget />
    case 'customer-inquiry-status-widget':
      return <CustomerInquiryStatusWidget />
    case 'program-schedule-widget':
      return <ProgramScheduleWidget />
    case 'menu-shortcut-widget':
      return <MenuShortcutWidget />
    case 'recruitment-status-widget':
      return <RecruitmentStatusWidget />
    case 'kpi-achievement-widget':
      return <KpiAchievementWidget />
    default:
      return null
  }
}
