import { Checkbox } from 'antd'
import '@/shared/components/calendar/ui/item-list/general-individual-application-list-item.css'

export type ParticipatingParticipantCalendarListRow = {
  id: string
  participantId: string
  participantName: string
  affiliationLabel: string
  gradeLabel: string
  sessionLabel: string
}

type ParticipatingParticipantCalendarListItemProps = {
  row: ParticipatingParticipantCalendarListRow
  checked: boolean
  onToggle: (participantId: string, checked: boolean) => void
}

export function ParticipatingParticipantCalendarListItem({
  row,
  checked,
  onToggle,
}: ParticipatingParticipantCalendarListItemProps) {
  return (
    <div className="general-individual-application-list-item">
      <div className="general-individual-application-list-item__body">
        <div className="general-individual-application-list-item__title-row">
          <span className="general-individual-application-list-item__title">
            {row.participantName}
          </span>
        </div>
        <div className="general-individual-application-list-item__meta">
          <span className="general-individual-application-list-item__meta-item">
            {row.affiliationLabel}
          </span>
          <span className="general-individual-application-list-item__title-divider" aria-hidden />
          <span className="general-individual-application-list-item__meta-item">
            {row.gradeLabel}
          </span>
          {row.sessionLabel !== '-' ? (
            <>
              <span className="general-individual-application-list-item__title-divider" aria-hidden />
              <span className="general-individual-application-list-item__meta-item general-individual-application-list-item__meta-item--session">
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
        <Checkbox checked={checked} onChange={e => onToggle(row.participantId, e.target.checked)} />
      </div>
    </div>
  )
}
