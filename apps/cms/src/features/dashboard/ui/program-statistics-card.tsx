/**
 * 프로그램 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { BookOutlined } from '@ant-design/icons'
import { StatisticsCard } from './statistics-card'

interface ProgramStatisticsCardProps {
  total: number
  inProgress: number
  completed: number
  loading?: boolean
}

export function ProgramStatisticsCard({
  total,
  inProgress,
  completed,
  loading = false,
}: ProgramStatisticsCardProps) {
  return (
    <StatisticsCard
      title="프로그램"
      value={total}
      prefix={<BookOutlined />}
      suffix="개"
      tags={[
        { color: 'blue', label: `진행중: ${inProgress}` },
        { color: 'green', label: `완료: ${completed}` },
      ]}
      to="/programs"
      loading={loading}
    />
  )
}
