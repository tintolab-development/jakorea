import { Checkbox } from 'antd'
import type { GeneralVolunteerInterview2CalendarListRow } from '@/features/program/general/lib/general-volunteer-interview2-calendar-list-rows'
import {
  formatSecondInterviewListScoreLabel,
  resolveSecondInterviewScreeningListBadgeLabel,
  resolveSecondInterviewScreeningTone,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import '@/features/program/shared/ui/volunteer-screening/second-interview-screening-tone.css'
import './general-volunteer-interview2-calendar-list-item.css'

export function GeneralVolunteerInterview2CalendarListItem({
  row,
  checked,
  onToggle,
}: {
  row: GeneralVolunteerInterview2CalendarListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}) {
  const tone = resolveSecondInterviewScreeningTone(row.effectiveStatus)

  return (
    <div className="general-volunteer-interview2-calendar-list-item">
      <div className="general-volunteer-interview2-calendar-list-item__body">
        <div className="general-volunteer-interview2-calendar-list-item__title-row">
          <span className="general-volunteer-interview2-calendar-list-item__name">
            {row.volunteerName}
          </span>
          <span className="general-volunteer-interview2-calendar-list-item__sep" aria-hidden>
            |
          </span>
          <span className="general-volunteer-interview2-calendar-list-item__slot">
            {row.slotLabel}
          </span>
        </div>
        <div className="general-volunteer-interview2-calendar-list-item__meta-row">
          <span
            className={[
              'second-interview-screening-status-badge',
              `second-interview-screening-tone--${tone}`,
            ].join(' ')}
          >
            {resolveSecondInterviewScreeningListBadgeLabel(row.effectiveStatus)}
          </span>
          <span className="general-volunteer-interview2-calendar-list-item__sep" aria-hidden>
            |
          </span>
          <span className="general-volunteer-interview2-calendar-list-item__score">
            {formatSecondInterviewListScoreLabel(row.effectiveStatus, row.totalScore)}
          </span>
        </div>
      </div>
      <div
        className="calendar-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
