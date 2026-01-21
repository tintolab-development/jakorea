/**
 * 매칭 캘린더 뷰
 * Phase 4.4: 매칭 관리 - 캘린더 보기 (FR-F03)
 */

import { Calendar, Badge, Card } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useState, useEffect, useCallback } from 'react'
import type { MatchingStatusItem } from '@/entities/matching/api/matching-status-service'
import { getMatchingStatusCalendar } from '@/entities/matching/api/matching-status-service'
import { handleError } from '@/shared/utils/error-handler'

interface MatchingCalendarViewProps {
  onDateClick?: (date: string, items: MatchingStatusItem[]) => void
}

export function MatchingCalendarView({ onDateClick }: MatchingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [calendarData, setCalendarData] = useState<Record<string, MatchingStatusItem[]>>({})
  const [loading, setLoading] = useState(false)

  const loadCalendarData = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const data = await getMatchingStatusCalendar(year, month)
      setCalendarData(data)
    } catch (error) {
      handleError(error, { defaultMessage: '캘린더 데이터를 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCalendarData(currentDate.year(), currentDate.month() + 1)
  }, [currentDate, loadCalendarData])

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const items = calendarData[dateStr] || []

    if (items.length === 0) return null

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.slice(0, 3).map(item => (
          <li key={item.id} style={{ marginBottom: 4 }}>
            <Badge
              status={
                item.status === 'CONFIRMED'
                  ? 'success'
                  : item.status === 'PENDING'
                    ? 'warning'
                    : 'default'
              }
              text={
                <span
                  style={{ fontSize: '12px', cursor: 'pointer' }}
                  onClick={() => onDateClick?.(dateStr, items)}
                >
                  {item.schoolName} - {item.programName}
                </span>
              }
            />
          </li>
        ))}
        {items.length > 3 && (
          <li style={{ fontSize: '12px', color: '#999' }}>
            +{items.length - 3}개 더
          </li>
        )}
      </ul>
    )
  }

  const onPanelChange = (date: Dayjs) => {
    setCurrentDate(date)
  }

  return (
    <Card loading={loading}>
      <Calendar
        value={currentDate}
        onPanelChange={onPanelChange}
        dateCellRender={dateCellRender}
        onSelect={(date) => {
          const dateStr = date.format('YYYY-MM-DD')
          const items = calendarData[dateStr] || []
          if (items.length > 0) {
            onDateClick?.(dateStr, items)
          }
        }}
      />
    </Card>
  )
}
