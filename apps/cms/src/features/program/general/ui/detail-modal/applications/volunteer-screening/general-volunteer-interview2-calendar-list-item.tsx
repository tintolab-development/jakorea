import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { GeneralVolunteerInterview2CalendarListRow } from '@/features/program/general/lib/general-volunteer-interview2-calendar-list-rows'
import {
  formatSecondInterviewListScoreLabel,
  resolveSecondInterviewScreeningTagPresentation,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import { StatusOutlineTag } from '@/shared/components/status-outline-tag'
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
  const checkboxDisabled = !row.selectableForResult

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
          <StatusOutlineTag {...resolveSecondInterviewScreeningTagPresentation(row.effectiveStatus)} />
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
        <CmsCheckbox
          checked={checked}
          disabled={checkboxDisabled}
          onChange={e => onToggle(row.id, e.target.checked)}
        />
      </div>
    </div>
  )
}
