import { Empty, Checkbox } from 'antd'
import type { Dayjs } from 'dayjs'
import type { ScheduleColorPair } from '../program-schedule-colors'
import './applicant-calendar-view.css'

interface ApplicantScheduleListProps {
  selectedDate?: Dayjs
  events: any[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onEventClick: (item: any) => void
  getColorForEvent?: (event: any) => ScheduleColorPair
}

export function ApplicantScheduleList({
  events,
  selectedRowKeys,
  onSelectionChange,
  onEventClick,
  getColorForEvent,
}: ApplicantScheduleListProps) {
  const handleToggleSelection = (id: React.Key) => {
    if (selectedRowKeys.includes(id)) {
      onSelectionChange(selectedRowKeys.filter(k => k !== id))
    } else {
      onSelectionChange([...selectedRowKeys, id])
    }
  }

  return (
    <div className="applicant-schedule-list">
      <div className="applicant-schedule-list-content">
        {events.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
        ) : (
          events.map(event => {
            const isSelected = selectedRowKeys.includes(event.id)
            const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
            const color = getColorForEvent?.(event)

            // Extract info from original item if available
            const originalItem = event.originalItem
            const rawGrade = originalItem?.educationGrade || originalItem?.desiredGrade || ''
            const grade = rawGrade ? (rawGrade.endsWith('학년') ? rawGrade : `${rawGrade}학년`) : ''
            const periodInfo = originalItem?.desiredEducationPeriod || ''

            // "N교시 (H:MM ~ H:MM)" 형식이면 그대로, 아니면 기존 시간만 추출
            let sessionInfo = periodInfo
            if (periodInfo && !periodInfo.includes('교시')) {
              const match = periodInfo.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/)
              if (match) {
                sessionInfo = `${match[1]} ~ ${match[2]}`
              }
            }

            const hasDetail = sessionInfo || grade

            return (
              <div
                key={event.id}
                className={`applicant-schedule-item ${isSelected ? 'applicant-schedule-item--selected' : ''}`}
                data-has-color={color ? 'true' : undefined}
                style={
                  color
                    ? {
                        backgroundColor: color.bg,
                        border: `1px solid ${color.border}`,
                      }
                    : undefined
                }
              >
                <div
                  className="applicant-schedule-item-info"
                  onClick={() => onEventClick(originalItem)}
                >
                  <div className="applicant-schedule-item-title">{displayTitle}</div>
                  {hasDetail && (
                    <div className="applicant-schedule-item-detail">
                      {sessionInfo && <span>{sessionInfo}</span>}
                      {sessionInfo && grade && (
                        <span className="applicant-schedule-item-detail-divider">|</span>
                      )}
                      {grade && <span>{grade}</span>}
                    </div>
                  )}
                </div>
                <div
                  className="applicant-schedule-item-checkbox"
                  onClick={() => handleToggleSelection(event.id)}
                >
                  <Checkbox checked={isSelected} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
