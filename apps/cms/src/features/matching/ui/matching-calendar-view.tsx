/**
 * 매칭 캘린더 뷰
 * Phase 4.4: 매칭 관리 - 캘린더 보기 (FR-F03)
 * Task 3.3.2: 상위에서 내려준 calendarData 사용, 캘린더/목록 데이터 동기화
 */

import { Calendar, Badge, Card } from 'antd'
import type { Dayjs } from 'dayjs'
import type { MatchingStatusItem } from '@/entities/matching/api/matching-status-service'

export interface MatchingCalendarViewProps {
  /** 날짜별 매칭 현황 (useMatchingStatus.calendarData) */
  calendarData: Record<string, MatchingStatusItem[]>
  /** 캘린더 기준 월 */
  value: Dayjs
  /** 월 변경 시 (캘린더/목록 공통 기간 갱신) */
  onPanelChange: (date: Dayjs) => void
  /** 날짜·일정 클릭 시 */
  onDateClick?: (date: string, items: MatchingStatusItem[]) => void
  loading?: boolean
}

export function MatchingCalendarView({
  calendarData,
  value,
  onPanelChange,
  onDateClick,
  loading = false,
}: MatchingCalendarViewProps) {
  const dateCellRender = (cellValue: Dayjs) => {
    const dateStr = cellValue.format('YYYY-MM-DD')
    const items = calendarData[dateStr] ?? []

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

  return (
    <Card loading={loading}>
      <Calendar
        value={value}
        onPanelChange={onPanelChange}
        dateCellRender={dateCellRender}
        onSelect={date => {
          const dateStr = date.format('YYYY-MM-DD')
          const items = calendarData[dateStr] ?? []
          if (items.length > 0) onDateClick?.(dateStr, items)
        }}
      />
    </Card>
  )
}
