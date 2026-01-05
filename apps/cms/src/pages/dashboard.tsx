/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { Card, Row, Col, Statistic } from 'antd'
import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import { mockInstructors } from '@/data/mock'
import { PendingActionsAlert } from '@/features/dashboard/ui/pending-actions-alert'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'
import { MyActivitySummary } from '@/features/dashboard/ui/my-activity-summary'
import { MyApplicationSummary } from '@/features/dashboard/ui/my-application-summary'

export function Dashboard() {
  const { user } = useAuthStore()
  const instructorCount = mockInstructors.length

  // 권한별 위젯 구성
  const widgets = useMemo(() => {
    return getDashboardWidgetsByRole(user?.role || null)
  }, [user?.role])

  // 위젯 타입에 따라 컴포넌트 렌더링
  const renderWidget = (widgetType: string) => {
    switch (widgetType) {
      case 'pending-actions-alert':
        return <PendingActionsAlert />
      case 'monthly-settlement-card':
        return <MonthlySettlementCard />
      case 'monthly-application-card':
        return <MonthlyApplicationCard />
      case 'active-program-card':
        return <ActiveProgramCard />
      case 'instructor-count-card':
        return (
          <Card>
            <Statistic title="등록된 강사" value={instructorCount} />
          </Card>
        )
      case 'unified-activity-feed':
        return <UnifiedActivityFeed pageSize={10} />
      case 'my-activity-summary':
        return <MyActivitySummary />
      case 'my-application-summary':
        return <MyApplicationSummary />
      default:
        return null
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>대시보드</h1>

      {/* 권한별 위젯 렌더링 */}
      <Row gutter={16}>
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
