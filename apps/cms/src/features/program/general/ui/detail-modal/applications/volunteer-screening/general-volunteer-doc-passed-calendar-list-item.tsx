import type { GeneralVolunteerDocPassedCalendarListRow } from '@/features/program/general/lib/general-volunteer-doc-passed-calendar-list-rows'
import './general-volunteer-doc-passed-calendar-list-item.css'

export function GeneralVolunteerDocPassedCalendarListItem({
  row,
}: {
  row: GeneralVolunteerDocPassedCalendarListRow
}) {
  return (
    <div className="general-volunteer-doc-passed-calendar-list-item">
      <div className="general-volunteer-doc-passed-calendar-list-item__title-row">
        <span className="general-volunteer-doc-passed-calendar-list-item__name">
          {row.volunteerName}
        </span>
        <span className="general-volunteer-doc-passed-calendar-list-item__sep" aria-hidden>
          |
        </span>
        <span className="general-volunteer-doc-passed-calendar-list-item__day-slots">
          {row.daySlotSummary}
        </span>
      </div>
      <div className="general-volunteer-doc-passed-calendar-list-item__tag-row">
        <span
          className={`general-volunteer-doc-passed-calendar-list-item__status-badge general-volunteer-doc-passed-calendar-list-item__status-badge--${row.assignmentStatus}`}
        >
          {row.assignmentStatusLabel}
        </span>
        <span className="general-volunteer-doc-passed-calendar-list-item__schedule-badge">
          면접 가능 일정 : {row.interviewSlotCount}개
        </span>
      </div>
    </div>
  )
}
