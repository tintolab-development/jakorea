import { Checkbox } from 'antd'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  formatUjatInterview2ScoreLabel,
  ujatInterview2ScreeningListBadgeLabel,
  ujatInterview2ScreeningTone,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview2-screening-ui'
import './ujat-volunteer-interview2-list-item.css'

export type CalendarVolunteerInterview2ListRow = {
  /** 지원자 id — 체크박스·rowKey */
  id: string
  /** 캘린더 이벤트 id — 색상 조회 */
  eventId: string
  volunteerName: string
  screeningStatus: UjatSecondInterviewScreeningStatus
  slotLabel: string
  totalScore: number | null | undefined
}

type CalendarListItemContentVolunteerInterview2Props = {
  row: CalendarVolunteerInterview2ListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}

export function CalendarListItemContentVolunteerInterview2({
  row,
  checked,
  onToggle,
}: CalendarListItemContentVolunteerInterview2Props) {
  const tone = ujatInterview2ScreeningTone(row.screeningStatus)
  return (
    <div className="ujat-volunteer-interview2-list-item">
      <div className="ujat-volunteer-interview2-list-item__body">
        <div className="ujat-volunteer-interview2-list-item__head">
          <span className="ujat-volunteer-interview2-list-item__name">{row.volunteerName}</span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span
            className={`ujat-volunteer-interview2-list-item__status-badge ujat-volunteer-interview2-list-item__status-badge--${tone}`}
          >
            {ujatInterview2ScreeningListBadgeLabel(row.screeningStatus)}
          </span>
        </div>
        <div className="ujat-volunteer-interview2-list-item__meta">
          <span className="ujat-volunteer-interview2-list-item__meta-slot">{row.slotLabel}</span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span className="ujat-volunteer-interview2-list-item__meta-score">
            {formatUjatInterview2ScoreLabel(row.totalScore)}
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
