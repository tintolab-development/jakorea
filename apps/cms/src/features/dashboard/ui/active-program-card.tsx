/**
 * 진행 중 프로그램 카드
 * Phase 1: 대시보드 고도화
 * Phase 3: 성능 최적화 (데이터 중앙화)
 */

import { Card, Statistic, Space, Tag, Typography } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { domainColorsHex } from '@/shared/constants/colors'
import { useDashboardData } from '../model/use-dashboard-data'

const { Text } = Typography

export function ActiveProgramCard() {
  const navigate = useNavigate()
  const { activePrograms } = useDashboardData()

  const { count, thisWeekSchedules, nextWeekSchedules } = activePrograms

  const handleClick = () => {
    navigate('/programs')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Statistic
        title="진행 중 프로그램"
        value={count}
        prefix={<BookOutlined />}
        suffix="개"
        valueStyle={{ color: domainColorsHex.program.primary }}
      />
      <Space direction="vertical" size="small" style={{ marginTop: 16, width: '100%' }}>
        {thisWeekSchedules > 0 && (
          <Tag color={domainColorsHex.schedule.primary}>
            이번 주 일정: {thisWeekSchedules}개
          </Tag>
        )}
        {nextWeekSchedules > 0 && (
          <Tag color={domainColorsHex.schedule.primary}>
            다음 주 일정: {nextWeekSchedules}개
          </Tag>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        클릭하여 프로그램 목록으로 이동
      </Text>
    </Card>
  )
}

