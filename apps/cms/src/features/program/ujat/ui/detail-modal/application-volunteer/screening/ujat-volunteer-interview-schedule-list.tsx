import { Empty } from 'antd'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatVolunteerInterviewCalendarEvent } from './ujat-volunteer-interview-calendar-events'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-calendar-view.css'

interface UjatVolunteerInterviewScheduleListProps {
  events: UjatVolunteerInterviewCalendarEvent[]
  onEventClick: (item: UjatVolunteerApplicantRow) => void
  getColorForEvent?: (event: UjatVolunteerInterviewCalendarEvent) => ScheduleColorPair
}

export function UjatVolunteerInterviewScheduleList({
  events,
  onEventClick,
  getColorForEvent,
}: UjatVolunteerInterviewScheduleListProps) {
  return (
    <div className="applicant-schedule-list">
      <div className="applicant-schedule-list-content">
        {events.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
        ) : (
          events.map(event => {
            const color = getColorForEvent?.(event)
            return (
              <div
                key={event.id}
                className="applicant-schedule-item"
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
                  role="button"
                  tabIndex={0}
                  onClick={() => onEventClick(event.originalItem)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onEventClick(event.originalItem)
                    }
                  }}
                >
                  <div className="applicant-schedule-item-title-row">
                    <span className="applicant-schedule-item-title">{event.volunteerName}</span>
                    <span className="applicant-schedule-item-title-divider" aria-hidden>
                      |
                    </span>
                    <span className="applicant-schedule-item-title">{event.preferredRegion}</span>
                  </div>
                  <div className="applicant-schedule-item-session">{event.slotLabel}</div>
                  <div className="applicant-schedule-item-tags">
                    <span className="applicant-schedule-item-tag applicant-schedule-item-tag--mint">
                      {event.assignmentStatusLabel}
                    </span>
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
