import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { GeneralVolunteerDocPassedCalendarListRow } from '@/features/program/general/lib/general-volunteer-doc-passed-calendar-list-rows'
import './general-volunteer-doc-passed-calendar-list-item.css'

export function GeneralVolunteerDocPassedCalendarListItem({
  row,
  checked,
  onToggle,
}: {
  row: GeneralVolunteerDocPassedCalendarListRow
  /** `onToggle`이 있을 때만 우측 체크박스 노출 (봉사자 시안 07-2) */
  checked?: boolean
  onToggle?: (applicantId: string, checked: boolean) => void
}) {
  const body = (
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

  if (!onToggle) return body

  return (
    <div className="general-volunteer-doc-passed-calendar-list-item__selectable">
      {body}
      <div
        className="calendar-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <CmsCheckbox
          checked={checked === true}
          onChange={e => onToggle(row.applicantId, e.target.checked)}
        />
      </div>
    </div>
  )
}
