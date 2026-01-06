/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { Card, Row, Col, Statistic, Space } from 'antd'
import { useMemo, useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import { mockInstructors } from '@/data/mock'
import { PendingActionsAlert } from '@/features/dashboard/ui/pending-actions-alert'
import { OverallStatisticsCards } from '@/features/dashboard/ui/overall-statistics-cards'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'
import { MyActivitySummary } from '@/features/dashboard/ui/my-activity-summary'
import { MyApplicationSummary } from '@/features/dashboard/ui/my-application-summary'
import { UpcomingSchedulesList } from '@/features/dashboard/ui/upcoming-schedules-list'
import { PendingTasksList } from '@/features/dashboard/ui/pending-tasks-list'
import { GlobalSearch } from '@/features/dashboard/ui/global-search'
import { NotificationList } from '@/features/dashboard/ui/notification-list'
import { getOverallStatistics, type OverallStatistics } from '@/features/dashboard/api/statistics-service'
import { getInstructorActivitySummary, type InstructorActivitySummary } from '@/features/dashboard/api/instructor-activity-service'

export function Dashboard() {
  const { user } = useAuthStore()
  const instructorCount = mockInstructors.length
  const [overallStatistics, setOverallStatistics] = useState<OverallStatistics | null>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [instructorActivity, setInstructorActivity] = useState<InstructorActivitySummary | null>(null)
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

  // 강사/봉사자일 경우 본인 활동 데이터 로드
  useEffect(() => {
    if (!((user?.role === 'INSTRUCTOR' || user?.role === 'VOLUNTEER') && user?.instructorId)) {
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
        return (
          <OverallStatisticsCards
            statistics={overallStatistics}
            loading={statisticsLoading}
          />
        )
      case 'monthly-settlement-card':
        return <MonthlySettlementCard />
      case 'monthly-application-card':
        return <MonthlyApplicationCard />
      case 'active-program-card':
        return <ActiveProgramCard />
      case 'instructor-count-card':
        return (
          <Card style={{ height: '100%' }}>
            <Statistic title="등록된 강사" value={instructorCount} />
          </Card>
        )
      case 'unified-activity-feed':
        return <UnifiedActivityFeed pageSize={10} />
      case 'my-activity-summary':
        return <MyActivitySummary />
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
      default:
        return null
    }
  }

  // 강사/봉사자일 경우 검색 및 알림 표시
  const showSearchAndNotification = user?.role === 'INSTRUCTOR' || user?.role === 'VOLUNTEER'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>대시보드</h1>
        {showSearchAndNotification && (
          <Space size="middle">
            <div style={{ width: 300 }}>
              <GlobalSearch />
            </div>
            <NotificationList />
          </Space>
        )}
      </div>

      {/* 권한별 위젯 렌더링 */}
      <Row gutter={[16, 16]}>
        {widgets.map((widget, index) => {
          const widgetComponent = renderWidget(widget.type)
          if (!widgetComponent) return null

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
