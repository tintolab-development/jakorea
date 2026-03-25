/**
 * 예정된 일정 목록
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import { Card, List, Tag, Typography, Button, Empty } from 'antd'
import { CalendarOutlined, RightOutlined } from '@ant-design/icons'
import type { Schedule } from '@/types'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Text } = Typography

interface UpcomingSchedulesListProps {
  schedules: Schedule[]
  loading?: boolean
  maxItems?: number
}

export function UpcomingSchedulesList({
  schedules,
  loading = false,
  maxItems = 5,
}: UpcomingSchedulesListProps) {
  const navigate = useNavigate()

  const displayedSchedules = schedules.slice(0, maxItems)
  const hasMore = schedules.length > maxItems

  const getScheduleDateInfo = (schedule: Schedule) => {
    const scheduleDate = dayjs(schedule.date)
    const now = dayjs()
    const isToday = scheduleDate.isSame(now, 'day')
    const isTomorrow = scheduleDate.isSame(now.add(1, 'day'), 'day')

    return {
      date: scheduleDate,
      isToday,
      isTomorrow,
      dateLabel: isToday
        ? '오늘'
        : isTomorrow
          ? '내일'
          : scheduleDate.format('MM/DD (ddd)'),
    }
  }

  const handleViewAll = () => {
    navigate('/schedules/my')
  }

  return (
    <Card
      title={
        <span>
          <CalendarOutlined style={{ marginRight: 8 }} />
          예정된 일정
        </span>
      }
      loading={loading}
      extra={
        hasMore && (
          <Button type="link" size="small" onClick={handleViewAll}>
            더보기 <RightOutlined />
          </Button>
        )
      }
      style={{ height: '100%' }}
    >
      {displayedSchedules.length === 0 ? (
        <Empty
          description="예정된 일정이 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <List
          dataSource={displayedSchedules}
          renderItem={schedule => {
            const dateInfo = getScheduleDateInfo(schedule)
            const timeLabel = `${schedule.startTime} - ${schedule.endTime}`
            const locationLabel = schedule.location || schedule.onlineLink || '장소 미정'

            return (
              <List.Item
                style={{ padding: '12px 0', cursor: 'pointer' }}
                onClick={() => navigate(`/schedules/${schedule.id}`)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={dateInfo.isToday ? 'red' : dateInfo.isTomorrow ? 'orange' : 'blue'}>
                        {dateInfo.dateLabel}
                      </Tag>
                      <Text strong>{schedule.title}</Text>
                    </div>
                  }
                  description={
                    <div>
                      <div>
                        <Text type="secondary">{timeLabel}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {locationLabel}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}

