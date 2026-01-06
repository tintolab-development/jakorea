/**
 * 전체 통계 카드 그룹
 * Phase 5.1.1: 관리자 대시보드
 */

import { Row, Col } from 'antd'
import { ProgramStatisticsCard } from './program-statistics-card'
import { ApplicationStatisticsCard } from './application-statistics-card'
import { MatchingStatisticsCard } from './matching-statistics-card'
import { SettlementStatisticsCard } from './settlement-statistics-card'
import type { OverallStatistics } from '../api/statistics-service'

interface OverallStatisticsCardsProps {
  statistics: OverallStatistics
  loading?: boolean
}

export function OverallStatisticsCards({
  statistics,
  loading = false,
}: OverallStatisticsCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <ProgramStatisticsCard
          total={statistics.programs.total}
          inProgress={statistics.programs.inProgress}
          completed={statistics.programs.completed}
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <ApplicationStatisticsCard
          total={statistics.applications.total}
          pending={statistics.applications.pending}
          approved={statistics.applications.approved}
          rejected={statistics.applications.rejected}
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <MatchingStatisticsCard
          total={statistics.matchings.total}
          confirmed={statistics.matchings.confirmed}
          pending={statistics.matchings.pending}
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SettlementStatisticsCard
          total={statistics.settlements.total}
          pending={statistics.settlements.pending}
          approved={statistics.settlements.approved}
          paid={statistics.settlements.paid}
          loading={loading}
        />
      </Col>
    </Row>
  )
}

