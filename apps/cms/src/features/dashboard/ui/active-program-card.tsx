/**
 * 진행 중 프로그램 카드
 * Phase 1: 대시보드 고도화
 */

import { Card, Statistic, Space, Tag, Typography } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { mockPrograms, mockSchedules } from '@/data/mock'
import dayjs from 'dayjs'
import { domainColorsHex } from '@/shared/constants/colors'

const { Text } = Typography

export function ActiveProgramCard() {
  const navigate = useNavigate()

  // 활성 상태인 프로그램
  const activePrograms = mockPrograms.filter(p => p.status === 'active')

  // 이번 주 일정 (오늘부터 7일 후까지)
  const today = dayjs()
  const nextWeek = today.add(7, 'day')
  const thisWeekSchedules = mockSchedules.filter(s => {
    const scheduleDate = typeof s.date === 'string' ? dayjs(s.date) : dayjs(s.date)
    return scheduleDate.isAfter(today.subtract(1, 'day')) && scheduleDate.isBefore(nextWeek.add(1, 'day'))
  })

  // 다음 주 일정 (7일 후부터 14일 후까지)
  const twoWeeksLater = today.add(14, 'day')
  const nextWeekSchedules = mockSchedules.filter(s => {
    const scheduleDate = typeof s.date === 'string' ? dayjs(s.date) : dayjs(s.date)
    return scheduleDate.isAfter(nextWeek.subtract(1, 'day')) && scheduleDate.isBefore(twoWeeksLater.add(1, 'day'))
  })

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
        value={activePrograms.length}
        prefix={<BookOutlined />}
        suffix="개"
        valueStyle={{ color: domainColorsHex.program.primary }}
      />
      <Space direction="vertical" size="small" style={{ marginTop: 16, width: '100%' }}>
        {thisWeekSchedules.length > 0 && (
          <Tag color={domainColorsHex.schedule.primary}>
            이번 주 일정: {thisWeekSchedules.length}개
          </Tag>
        )}
        {nextWeekSchedules.length > 0 && (
          <Tag color={domainColorsHex.schedule.primary}>
            다음 주 일정: {nextWeekSchedules.length}개
          </Tag>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        클릭하여 프로그램 목록으로 이동
      </Text>
    </Card>
  )
}

