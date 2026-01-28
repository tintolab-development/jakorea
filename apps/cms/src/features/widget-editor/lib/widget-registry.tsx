/**
 * 위젯 레지스트리
 * 기존 대시보드 위젯 컴포넌트들을 등록
 */

import type { WidgetDefinition } from '../model/widget-types'
import { NotificationWidget } from '@/features/dashboard/ui/notification-widget'
import { CustomerInquiryStatusWidget } from '@/features/dashboard/ui/customer-inquiry-status-widget'
import { ProgramScheduleWidget } from '@/features/dashboard/ui/program-schedule-widget'
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
import { OverallProgramProgressCard } from '@/features/dashboard/ui/overall-program-progress-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'
import { MyActivitySummary } from '@/features/dashboard/ui/my-activity-summary'
import { MyVolunteerActivitySummary } from '@/features/dashboard/ui/my-volunteer-activity-summary'
import { MyApplicationSummary } from '@/features/dashboard/ui/my-application-summary'
import { UpcomingSchedulesList } from '@/features/dashboard/ui/upcoming-schedules-list'
import { PendingTasksList } from '@/features/dashboard/ui/pending-tasks-list'
import { VolunteerPendingTasksList } from '@/features/dashboard/ui/volunteer-pending-tasks-list'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { PendingApplicationsCard } from '@/features/dashboard/ui/pending-applications-card'
import { PendingMatchingsCard } from '@/features/dashboard/ui/pending-matchings-card'
import { PendingSettlementsCard } from '@/features/dashboard/ui/pending-settlements-card'
import { PendingActionsRow } from '@/features/dashboard/ui/pending-actions-row'
import { OverallStatisticsCards } from '@/features/dashboard/ui/overall-statistics-cards'

/**
 * 위젯 레지스트리
 */
export const widgetRegistry: WidgetDefinition[] = [
  {
    key: 'notification-widget',
    title: '알림',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: NotificationWidget,
  },
  {
    key: 'customer-inquiry-status-widget',
    title: '고객 문의 현황',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: CustomerInquiryStatusWidget,
  },
  {
    key: 'program-schedule-widget',
    title: '프로그램 일정',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 5 },
      large: { w: 12, h: 8 },
    },
    render: ProgramScheduleWidget,
  },
  {
    key: 'program-progress-tabs-table',
    title: '전체 프로그램 진행 현황',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 12, h: 6 },
      large: { w: 24, h: 10 },
    },
    render: ProgramProgressTabsTable,
  },
  {
    key: 'overall-program-progress-card',
    title: '전체 강의 진행 현황',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: OverallProgramProgressCard,
  },
  {
    key: 'unified-activity-feed',
    title: '통합 활동 피드',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 12, h: 6 },
      large: { w: 24, h: 8 },
    },
    render: UnifiedActivityFeed,
  },
  {
    key: 'my-activity-summary',
    title: '본인 활동 요약',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: MyActivitySummary,
  },
  {
    key: 'my-volunteer-activity-summary',
    title: '본인 봉사 활동 요약',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: MyVolunteerActivitySummary,
  },
  {
    key: 'my-application-summary',
    title: '본인 신청 현황',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 12, h: 6 },
    },
    render: MyApplicationSummary,
  },
  {
    key: 'upcoming-schedules-list',
    title: '예정된 일정 목록',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 5 },
      large: { w: 12, h: 6 },
    },
    render: UpcomingSchedulesList,
  },
  {
    key: 'pending-tasks-list',
    title: '대기 중인 작업 목록',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 5 },
      large: { w: 12, h: 6 },
    },
    render: PendingTasksList,
  },
  {
    key: 'volunteer-pending-tasks-list',
    title: '대기 중인 작업 목록 (봉사자)',
    supportsSize: true,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 5 },
      large: { w: 12, h: 6 },
    },
    render: VolunteerPendingTasksList,
  },
  {
    key: 'monthly-settlement-card',
    title: '월별 정산 현황',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: MonthlySettlementCard,
  },
  {
    key: 'monthly-application-card',
    title: '월별 신청 현황',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: MonthlyApplicationCard,
  },
  {
    key: 'active-program-card',
    title: '활성 프로그램',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: ActiveProgramCard,
  },
  {
    key: 'pending-applications-card',
    title: '대기 중인 신청',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: PendingApplicationsCard,
  },
  {
    key: 'pending-matchings-card',
    title: '대기 중인 매칭',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: PendingMatchingsCard,
  },
  {
    key: 'pending-settlements-card',
    title: '대기 중인 정산',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 6, h: 4 },
      large: { w: 6, h: 4 },
    },
    render: PendingSettlementsCard,
  },
  {
    key: 'pending-actions-row',
    title: '대기 중인 작업',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 12, h: 4 },
      large: { w: 24, h: 4 },
    },
    render: PendingActionsRow,
  },
  {
    key: 'overall-statistics-cards',
    title: '전체 통계',
    supportsSize: false,
    defaultSize: 'large',
    sizePresets: {
      small: { w: 12, h: 4 },
      large: { w: 24, h: 4 },
    },
    render: OverallStatisticsCards,
  },
]

/**
 * 위젯 키로 정의 찾기
 */
export function getWidgetDefinition(key: string): WidgetDefinition | undefined {
  return widgetRegistry.find(w => w.key === key)
}

/**
 * 사용 가능한 위젯 목록 반환 (권한 필터링)
 */
export function getAvailableWidgets(role: string | null): WidgetDefinition[] {
  if (!role) {
    return []
  }
  
  return widgetRegistry.filter(widget => {
    if (widget.visibilityRules) {
      return widget.visibilityRules({ role: role as any })
    }
    return true
  })
}
