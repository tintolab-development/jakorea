import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from './calendar-approval-status-badge'
import { StatusOutlineTag } from '@/shared/components/status-outline-tag'
import './general-instructor-application-list-item.css'

export type CalendarGeneralInstructorApplicationListRow = {
  id: string
  /** `buildResolvedColorMap` 조회용 */
  colorKey: string | number
  schoolName: string
  instructorName: string
  approvalStatus: ApprovalStatusKey
  sessionLabel: string
  distanceKm: number | null
  distanceDisplay: string
  isNearDistance: boolean
  dispatchCount: number
  longDistanceCount: number
  /** true면 승인 상태 옆 「활동 포기」 뱃지. 호출부가 켠 화면(일반 기관형)에서만 채운다 */
  activityWithdrawn?: boolean
}

/** 참여 봉사자 캘린더 카드 「활동 포기」와 같은 톤 */
const ACTIVITY_WITHDRAWN_ACCENT = 'var(--Status-red-main, #c32f4a)'

type CalendarListItemContentGeneralInstructorApplicationProps = {
  row: CalendarGeneralInstructorApplicationListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}

export function CalendarListItemContentGeneralInstructorApplication({
  row,
  checked,
  onToggle,
}: CalendarListItemContentGeneralInstructorApplicationProps) {
  return (
    <div className="general-instructor-application-list-item">
      <div className="general-instructor-application-list-item__body">
        <div className="general-instructor-application-list-item__header">
          <span className="general-instructor-application-list-item__school">{row.schoolName}</span>
          <span className="general-instructor-application-list-item__divider" aria-hidden />
          <CalendarApprovalStatusBadge status={row.approvalStatus} />
          {row.activityWithdrawn ? (
            <StatusOutlineTag label="활동 포기" accentColor={ACTIVITY_WITHDRAWN_ACCENT} />
          ) : null}
        </div>
        <div className="general-instructor-application-list-item__session">
          <span className="general-instructor-application-list-item__instructor">
            {row.instructorName}
          </span>
          {row.sessionLabel !== '-' ? (
            <>
              <span className="general-instructor-application-list-item__divider" aria-hidden />
              <span className="general-instructor-application-list-item__round">{row.sessionLabel}</span>
            </>
          ) : null}
        </div>
        <div className="general-instructor-application-list-item__tags">
          <span
            className={[
              'general-instructor-application-list-item__tag',
              row.isNearDistance ? 'general-instructor-application-list-item__tag--mint' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            거리 : {row.distanceDisplay}
          </span>
          <span className="general-instructor-application-list-item__tag">
            출강 : {row.dispatchCount}회
          </span>
          <span className="general-instructor-application-list-item__tag">
            장거리 : {row.longDistanceCount}회
          </span>
        </div>
      </div>
      <div
        className="calendar-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <CmsCheckbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
