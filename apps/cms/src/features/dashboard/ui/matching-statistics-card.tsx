/**
 * 매칭 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { TeamOutlined } from '@ant-design/icons'
import { StatisticsCard } from './statistics-card'

interface MatchingStatisticsCardProps {
  total: number
  confirmed: number
  pending: number
  loading?: boolean
}

export function MatchingStatisticsCard({
  total,
  confirmed,
  pending,
  loading = false,
}: MatchingStatisticsCardProps) {
  return (
    <StatisticsCard
      title="매칭"
      value={total}
      prefix={<TeamOutlined />}
      suffix="건"
      tags={[
        { color: 'green', label: `확정: ${confirmed}` },
        { color: 'orange', label: `대기: ${pending}` },
      ]}
      to="/programs/education/instructor-recruitment"
      loading={loading}
    />
  )
}
