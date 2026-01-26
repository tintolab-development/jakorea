/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { Card, Row, Col, Statistic, Divider } from 'antd'
import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { mockInstructors } from '@/data/mock'
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
import { GlobalSearch } from '@/features/dashboard/ui/global-search'
import { OverallProgramProgressCard } from '@/features/dashboard/ui/overall-program-progress-card'
import { ProgramProgressWidget } from '@/features/dashboard/ui/program-progress-widget'
import { PendingApplicationsCard } from '@/features/dashboard/ui/pending-applications-card'
import { PendingMatchingsCard } from '@/features/dashboard/ui/pending-matchings-card'
import { PendingSettlementsCard } from '@/features/dashboard/ui/pending-settlements-card'
import { PendingActionsRow } from '@/features/dashboard/ui/pending-actions-row'
import { NotificationWidget } from '@/features/dashboard/ui/notification-widget'
import {
  getOverallStatistics,
  type OverallStatistics,
} from '@/features/dashboard/api/statistics-service'
import {
  getInstructorActivitySummary,
  type InstructorActivitySummary,
} from '@/features/dashboard/api/instructor-activity-service'

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '메인 홈'
  const instructorCount = mockInstructors.length
  const [overallStatistics, setOverallStatistics] = useState<OverallStatistics | null>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [instructorActivity, setInstructorActivity] = useState<InstructorActivitySummary | null>(
    null
  )
  const [instructorActivityLoading, setInstructorActivityLoading] = useState(false)

  // 권한별 위젯 구성
  const widgets = useMemo(() => {
    return getDashboardWidgetsByRole(user?.role || null)
  }, [user?.role])

  // 관리자일 경우 전체 통계 데이터 로드
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setOverallStatistics(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      setStatisticsLoading(true)
      try {
        const data = await getOverallStatistics()
        if (!cancelled) {
          setOverallStatistics(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('통계 데이터 로드 실패:', error)
        }
      } finally {
        if (!cancelled) {
          setStatisticsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.role])

  // 강사/개인(참여자)일 경우 본인 활동 데이터 로드
  useEffect(() => {
    if (!((user?.role === 'INSTRUCTOR' || user?.role === 'INDIVIDUAL') && user?.instructorId)) {
      setInstructorActivity(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      if (!user.instructorId) return

      setInstructorActivityLoading(true)
      try {
        const data = await getInstructorActivitySummary(user.instructorId)
        if (!cancelled) {
          setInstructorActivity(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('활동 데이터 로드 실패:', error)
        }
      } finally {
        if (!cancelled) {
          setInstructorActivityLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.role, user?.instructorId])

  // 위젯 타입에 따라 컴포넌트 렌더링
  const renderWidget = (widgetType: string) => {
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
        return <OverallStatisticsCards statistics={overallStatistics} loading={statisticsLoading} />
      case 'overall-program-progress-card':
        return <OverallProgramProgressCard />
      case 'program-progress-widget':
        return <ProgramProgressWidget />
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
            onClick={() => navigate('/instructors')}
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
            reportPending={instructorActivity.pendingTasks.reportPending}
            settlementPending={instructorActivity.pendingTasks.settlementPending}
            settlementTasks={instructorActivity.pendingTasks.settlementTasks}
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
            reportPending={instructorActivity.pendingTasks.reportPending}
            reportTasks={[]} // TODO: API 연동 시 실제 작업 목록 전달
            loading={instructorActivityLoading}
          />
        )
      case 'notification-widget':
        return <NotificationWidget />
      default:
        return null
    }
  }

  // 검색 및 알림 표시 (관리자, 강사, 개인(참여자), 학교)
  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  const showSearchAndNotification =
    user?.role === 'ADMIN' ||
    user?.role === 'INSTRUCTOR' ||
    user?.role === 'INDIVIDUAL' ||
    user?.role === 'SCHOOL'

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        {showSearchAndNotification && (
          <div style={{ width: 300 }}>
            <GlobalSearch />
          </div>
        )}
      </div>

      {/* 권한별 위젯 렌더링 */}
      <Row gutter={[16, 16]}>
        {widgets.map((widget, index) => {
          const widgetComponent = renderWidget(widget.type)
          if (!widgetComponent) return null

          const isNotificationWidget = widget.type === 'notification-widget'
          const isFirstWidget = index === 0

          if (isNotificationWidget && isFirstWidget) {
            return (
              <Col key={`notification-wrapper-${index}`} span={24}>
                {widgetComponent}
                <Divider style={{ margin: '24px 0' }} />
              </Col>
            )
          }

          return (
            <Col key={`${widget.type}-${index}`} span={widget.colSpan || 6}>
              {widgetComponent}
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
