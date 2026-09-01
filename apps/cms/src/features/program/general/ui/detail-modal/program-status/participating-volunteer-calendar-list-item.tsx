import { Checkbox } from 'antd'
import '@/shared/components/calendar/ui/item-list/general-institution-application-list-item.css'

export type ParticipatingVolunteerCalendarListRow = {
  id: string
  volunteerId: string
  schoolName: string
  volunteerName: string
  regionLabel: string
  sessionLabel: string
}

type ParticipatingVolunteerCalendarListItemProps = {
  row: ParticipatingVolunteerCalendarListRow
  checked: boolean
  onToggle: (volunteerId: string, checked: boolean) => void
}

export function ParticipatingVolunteerCalendarListItem({
  row,
  checked,
  onToggle,
}: ParticipatingVolunteerCalendarListItemProps) {
  return (
    <div className="general-institution-application-list-item">
      <div className="general-institution-application-list-item__body">
        <div className="general-institution-application-list-item__title-row">
          <span className="general-institution-application-list-item__title">{row.schoolName}</span>
          <span className="general-institution-application-list-item__title-divider" aria-hidden />
          <span className="general-institution-application-list-item__title general-institution-application-list-item__title--secondary">
            {row.volunteerName}
          </span>
        </div>
        <div className="general-institution-application-list-item__meta">
          <span className="general-institution-application-list-item__meta-item">
            {row.regionLabel}
          </span>
          {row.sessionLabel !== '-' ? (
            <>
              <span className="general-institution-application-list-item__title-divider" aria-hidden />
              <span className="general-institution-application-list-item__meta-item general-institution-application-list-item__meta-item--session">
                {row.sessionLabel}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div
        className="calendar-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Checkbox
          checked={checked}
          onChange={e => onToggle(row.volunteerId, e.target.checked)}
        />
      </div>
    </div>
  )
}
