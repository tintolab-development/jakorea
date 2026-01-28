/**
 * 프로그램 일정 위젯
 * Phase: 관리자 홈 화면 - 프로그램 일정 위젯 (현재 주차 캘린더 + 이벤트 리스트)
 * - 현재 주차 7일만 표시
 * - 캘린더와 일정 리스트 구분선으로 분리
 * - 일정 column 형식 (타입 | 시간 / 설명)
 */

import { Card, List, Typography, Button, Space, Empty } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { mockSchedules, mockPrograms } from '@/data/mock'
import { programService } from '@/entities/program/api/program-service'
import type { Schedule } from '@/types'
import '@/shared/ui/widget-more-button.css'
import './program-schedule-widget.css'

const { Text } = Typography

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

interface ScheduleEvent {
  id: string
  type: 'education' | 'recruitment_deadline' | 'recruitment_start'
  title: string
  time: string
  programId: string
  programTitle: string
}

function getEventTypeLabel(type: ScheduleEvent['type']) {
  switch (type) {
    case 'education':
      return '교육 예정'
    case 'recruitment_deadline':
      return '모집 마감'
    case 'recruitment_start':
      return '모집 시작'
    default:
      return ''
  }
}

export function ProgramScheduleWidget() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())

  // 현재 주차(선택된 날짜 기준) 7일
  const currentWeekDays = useMemo(() => {
    const start = selectedDate.startOf('week')
    const days: Dayjs[] = []
    for (let i = 0; i < 7; i++) {
      days.push(start.add(i, 'day'))
    }
    return days
  }, [selectedDate])

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    mockSchedules.forEach(schedule => {
      const dateKey = dayjs(schedule.date).format('YYYY-MM-DD')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(schedule)
    })
    return grouped
  }, [])

  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    const schedules = schedulesByDate[dateKey] || []
    const events: ScheduleEvent[] = []

    schedules.forEach(schedule => {
      const program = programService.getByIdSync(schedule.programId)
      if (program) {
        events.push({
          id: schedule.id,
          type: 'education',
          title: `${program.title} ${schedule.title || ''}`.trim(),
          time: schedule.startTime || '00:00',
          programId: program.id,
          programTitle: program.title,
        })
      }
    })

    mockPrograms.forEach(program => {
      const applicationEndDate = program.applicationEndDate
        ? dayjs(program.applicationEndDate)
        : null
      const applicationStartDate = program.applicationStartDate
        ? dayjs(program.applicationStartDate)
        : null

      if (applicationEndDate?.isSame(selectedDate, 'day')) {
        events.push({
          id: `recruitment-deadline-${program.id}`,
          type: 'recruitment_deadline',
          title: `${program.title} 모집 마감일`,
          time: '24:00',
          programId: program.id,
          programTitle: program.title,
        })
      }
      if (applicationStartDate?.isSame(selectedDate, 'day')) {
        events.push({
          id: `recruitment-start-${program.id}`,
          type: 'recruitment_start',
          title: `${program.title} 강사 모집 시작일`,
          time: '24:00',
          programId: program.id,
          programTitle: program.title,
        })
      }
    })

    return events.sort((a, b) => {
      const timeA = a.time === '24:00' ? '23:59' : a.time
      const timeB = b.time === '24:00' ? '23:59' : b.time
      return timeA.localeCompare(timeB)
    })
  }, [selectedDate, schedulesByDate])

  const handleDateSelect = (date: Dayjs) => setSelectedDate(date)
  const handleViewAll = () => navigate('/schedules')

  const handleEventClick = (event: ScheduleEvent) => {
    if (event.type === 'education') {
      // 교육 예정: 일정 상세 페이지로 이동
      navigate(`/schedules/${event.id}`)
    } else {
      // 모집 마감/시작: 일정 캘린더 페이지로 이동 (해당 날짜 필터링 가능하도록)
      navigate('/schedules')
    }
  }

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>프로그램 일정</span>
          <Text type="secondary" className="program-schedule-widget__date-ref">
            {selectedDate.format('YYYY.MM.DD')} 기준
          </Text>
        </Space>
      }
      extra={
        <Button type="link" size="small" onClick={handleViewAll} className="widget-more-button">
          더보기
        </Button>
      }
      className="program-schedule-widget"
    >
      <div className="program-schedule-widget__content">
        {/* 현재 주차 7일 캘린더 */}
        <div className="program-schedule-widget__calendar">
          <div className="program-schedule-widget__week-days">
            {WEEKDAY_LABELS.map((label, idx) => (
              <div key={idx} className="program-schedule-widget__week-day-label">
                {label}
              </div>
            ))}
          </div>
          <div className="program-schedule-widget__week-dates">
            {currentWeekDays.map((day, idx) => {
              const isSelected = day.isSame(selectedDate, 'day')
              const isToday = day.isSame(dayjs(), 'day')
              return (
                <button
                  type="button"
                  key={idx}
                  className={`program-schedule-widget__week-date ${isSelected ? 'program-schedule-widget__week-date--selected' : ''} ${isToday ? 'program-schedule-widget__week-date--today' : ''}`}
                  onClick={() => handleDateSelect(day)}
                >
                  {day.format('DD')}
                </button>
              )
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div className="program-schedule-widget__divider" role="separator" />

        {/* 선택된 날짜의 일정 리스트 (column 형식) */}
        <div className="program-schedule-widget__events">
          {selectedDateEvents.length === 0 ? (
            <Empty
              description="해당 날짜에 일정이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="program-schedule-widget__empty"
            />
          ) : (
            <List
              dataSource={selectedDateEvents}
              split={false}
              className="program-schedule-widget__event-list"
              renderItem={event => (
                <List.Item
                  className="program-schedule-widget__event-item"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="program-schedule-widget__event-column">
                    <div className="program-schedule-widget__event-head">
                      <span className="program-schedule-widget__event-type">
                        {getEventTypeLabel(event.type)}
                      </span>
                      <span className="program-schedule-widget__event-time">| {event.time}</span>
                    </div>
                    <div className="program-schedule-widget__event-desc">{event.title}</div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>
    </Card>
  )
}
