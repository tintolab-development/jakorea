/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { Card, Row, Col, Statistic } from 'antd'
import { mockInstructors } from '@/data/mock'
import { PendingActionsAlert } from '@/features/dashboard/ui/pending-actions-alert'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'

export function Dashboard() {
  const instructorCount = mockInstructors.length

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>대시보드</h1>

      {/* Phase 1: 즉시 처리 필요 작업 Alert Bar */}
      <PendingActionsAlert />

      {/* 핵심 지표 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <MonthlySettlementCard />
        </Col>
        <Col span={6}>
          <MonthlyApplicationCard />
        </Col>
        <Col span={6}>
          <ActiveProgramCard />
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="등록된 강사" value={instructorCount} />
          </Card>
        </Col>
      </Row>

      {/* Phase 1: 통합 활동 피드 */}
      <Row gutter={16}>
        <Col span={24}>
          <UnifiedActivityFeed limit={20} />
        </Col>
      </Row>
    </div>
  )
}
