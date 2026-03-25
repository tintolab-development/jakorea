/**
 * 정산 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { DollarOutlined } from '@ant-design/icons'
import { StatisticsCard } from './statistics-card'

interface SettlementStatisticsCardProps {
  total: number
  pending: number
  approved: number
  paid: number
  loading?: boolean
}

export function SettlementStatisticsCard({
  total,
  pending,
  approved,
  paid,
  loading = false,
}: SettlementStatisticsCardProps) {
  return (
    <StatisticsCard
      title="정산"
      value={total}
      prefix={<DollarOutlined />}
      suffix="건"
      tags={[
        { color: 'orange', label: `대기: ${pending}` },
        { color: 'blue', label: `승인: ${approved}` },
        { color: 'green', label: `지급완료: ${paid}` },
      ]}
      to="/programs/education/enrollment"
      loading={loading}
    />
  )
}
