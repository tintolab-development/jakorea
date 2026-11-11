import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { StatusOutlineTag } from '@/shared/components/status-outline-tag'
import '@/shared/components/calendar/ui/item-list/general-institution-application-list-item.css'
import '@/shared/components/calendar/ui/item-list/general-instructor-application-list-item.css'

/** 기관형 카드 지표 — 「거리 : - | 출강 : N회 | 장거리 : -」 (값 없으면 '-') */
export type ParticipatingVolunteerCalendarMetrics = {
  distanceDisplay: string
  dispatchDisplay: string
  longDistanceDisplay: string
}

function formatCountDisplay(count: number | null | undefined): string {
  return typeof count === 'number' && Number.isFinite(count) ? `${count}회` : '-'
}

/** participants 지표 → 카드 표기. 봉사자 거리·장거리는 서버가 null로 준다 */
export function buildParticipatingVolunteerCalendarMetrics(input: {
  distanceDisplay: string
  programDispatchCount?: number | null
  programLongDistanceDispatchCount?: number | null
}): ParticipatingVolunteerCalendarMetrics {
  return {
    distanceDisplay: input.distanceDisplay,
    dispatchDisplay: formatCountDisplay(input.programDispatchCount),
    longDistanceDisplay: formatCountDisplay(input.programLongDistanceDispatchCount),
  }
}

export type ParticipatingVolunteerCalendarListRow = {
  id: string
  volunteerId: string
  schoolName: string
  volunteerName: string
  regionLabel: string
  sessionLabel: string
  /** 기관형 — 「활동 포기」 뱃지 노출 */
  activityWithdrawn?: boolean
  /** 기관형 — 거리·출강·장거리 지표. 없으면 줄을 그리지 않는다(기존 표면) */
  metrics?: ParticipatingVolunteerCalendarMetrics
}

const ACTIVITY_WITHDRAWN_ACCENT = 'var(--Status-red-main, #c32f4a)'

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
          {row.activityWithdrawn ? (
            <StatusOutlineTag label="활동 포기" accentColor={ACTIVITY_WITHDRAWN_ACCENT} />
          ) : null}
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
        {row.metrics ? (
          <div className="general-instructor-application-list-item__tags">
            <span className="general-instructor-application-list-item__tag">
              거리 : {row.metrics.distanceDisplay}
            </span>
            <span className="general-instructor-application-list-item__tag">
              출강 : {row.metrics.dispatchDisplay}
            </span>
            <span className="general-instructor-application-list-item__tag">
              장거리 : {row.metrics.longDistanceDisplay}
            </span>
          </div>
        ) : null}
      </div>
      <div
        className="calendar-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <CmsCheckbox
          checked={checked}
          onChange={e => onToggle(row.volunteerId, e.target.checked)}
        />
      </div>
    </div>
  )
}
