import { Fragment } from 'react'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/shared/components/calendar/ui/item-list/general-individual-application-list-item.css'

export type ParticipatingParticipantCalendarListRow = {
  id: string
  participantId: string
  participantName: string
  /** 이름 아래 메타 (참여자: 소속·학년 / 봉사자: 배정 기관) — 디바이더로 구분 */
  metaLabels: readonly string[]
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
          {row.metaLabels.map((label, index) => (
            <Fragment key={`${label}-${index}`}>
              {index > 0 ? (
                <span
                  className="general-individual-application-list-item__title-divider"
                  aria-hidden
                />
              ) : null}
              <span className="general-individual-application-list-item__meta-item">{label}</span>
            </Fragment>
          ))}
          {row.sessionLabel !== '-' ? (
            <>
              {row.metaLabels.length > 0 ? (
                <span
                  className="general-individual-application-list-item__title-divider"
                  aria-hidden
                />
              ) : null}
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
        <CmsCheckbox checked={checked} onChange={e => onToggle(row.participantId, e.target.checked)} />
      </div>
    </div>
  )
}
