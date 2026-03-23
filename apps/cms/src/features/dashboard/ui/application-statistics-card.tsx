/**
 * 신청 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { FileTextOutlined } from '@ant-design/icons'
import { StatisticsCard } from './statistics-card'

interface ApplicationStatisticsCardProps {
  total: number
  pending: number
  approved: number
  rejected: number
  loading?: boolean
}

export function ApplicationStatisticsCard({
  total,
  pending,
  approved,
  rejected,
  loading = false,
}: ApplicationStatisticsCardProps) {
  return (
    <StatisticsCard
      title="신청"
      value={total}
      prefix={<FileTextOutlined />}
      suffix="건"
      tags={[
        { color: 'orange', label: `대기: ${pending}` },
        { color: 'green', label: `승인: ${approved}` },
        { color: 'red', label: `반려: ${rejected}` },
      ]}
      to="/applications"
      loading={loading}
    />
  )
}
