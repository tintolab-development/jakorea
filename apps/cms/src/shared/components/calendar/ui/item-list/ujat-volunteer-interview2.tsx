import { Checkbox } from 'antd'
import type { SecondInterviewScreeningEffectiveStatus } from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import {
  formatSecondInterviewListScoreLabel,
  resolveSecondInterviewScreeningListBadgeLabel,
  resolveSecondInterviewScreeningTone,
} from '@/features/program/shared/lib/volunteer-screening/second-interview-screening-ui'
import '@/features/program/shared/ui/volunteer-screening/second-interview-screening-tone.css'
import './ujat-volunteer-interview2-list-item.css'

export type CalendarVolunteerInterview2ListRow = {
  /** 지원자 id — 체크박스·rowKey */
  id: string
  /** 캘린더 이벤트 id — 색상 조회 */
  eventId: string
  volunteerName: string
  screeningStatus: SecondInterviewScreeningEffectiveStatus
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
  const tone = resolveSecondInterviewScreeningTone(row.screeningStatus)
  return (
    <div className="ujat-volunteer-interview2-list-item">
      <div className="ujat-volunteer-interview2-list-item__body">
        <div className="ujat-volunteer-interview2-list-item__head">
          <span className="ujat-volunteer-interview2-list-item__name">{row.volunteerName}</span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span className="ujat-volunteer-interview2-list-item__slot">{row.slotLabel}</span>
        </div>
        <div className="ujat-volunteer-interview2-list-item__meta">
          <span
            className={[
              'second-interview-screening-status-badge',
              `second-interview-screening-tone--${tone}`,
            ].join(' ')}
          >
            {resolveSecondInterviewScreeningListBadgeLabel(row.screeningStatus)}
          </span>
          <span className="ujat-volunteer-interview2-list-item__sep" aria-hidden>
            |
          </span>
          <span className="ujat-volunteer-interview2-list-item__meta-score">
            {formatSecondInterviewListScoreLabel(row.screeningStatus, row.totalScore)}
          </span>
        </div>
      </div>
      <div
        className="calendar-list-item__checkbox ujat-volunteer-interview2-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
