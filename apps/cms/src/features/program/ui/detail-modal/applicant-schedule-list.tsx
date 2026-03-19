import { Empty, Checkbox } from 'antd'
import type { Dayjs } from 'dayjs'
import './applicant-calendar-view.css'

interface ApplicantScheduleListProps {
  selectedDate?: Dayjs
  events: any[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onEventClick: (item: any) => void
  getColorForEvent?: (event: any) => { primary: string; light: string }
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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="해당 날짜에 일정이 없습니다"
          />
        ) : (
          events.map(event => {
            const isSelected = selectedRowKeys.includes(event.id)
            const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
            const color = getColorForEvent?.(event)

            // Extract info from original item if available
            const originalItem = event.originalItem
            const grade = originalItem?.educationGrade || originalItem?.desiredGrade || ''
            const periodInfo = originalItem?.desiredEducationPeriod || ''
            
            // Extract "1교시 (9:20 ~ 10:10)" from period info if possible
            // Format expected: "2026-01-09 09:20 - 10:10"
            let sessionInfo = ''
            if (periodInfo) {
              const match = periodInfo.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
              if (match) {
                sessionInfo = `${match[1]} ~ ${match[2]}`
              }
            }

            return (
              <div
                key={event.id}
                className={`applicant-schedule-item ${isSelected ? 'applicant-schedule-item--selected' : ''}`}
                data-has-color={color ? 'true' : undefined}
                style={
                  color
                    ? {
                        backgroundColor: color.light,
                      }
                    : undefined
                }
              >
                <div className="applicant-schedule-item-checkbox" onClick={() => handleToggleSelection(event.id)}>
                  <Checkbox checked={isSelected} />
                </div>
                <div className="applicant-schedule-item-info" onClick={() => onEventClick(originalItem)}>
                  <div className="applicant-schedule-item-title">{displayTitle}</div>
                  <div className="applicant-schedule-item-detail">
                    {sessionInfo && <span>{sessionInfo}</span>}
                    {sessionInfo && grade && <span className="detail-divider">|</span>}
                    {grade && <span>{grade}</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
