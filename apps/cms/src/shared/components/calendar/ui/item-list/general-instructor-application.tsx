import { Checkbox } from 'antd'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from './calendar-approval-status-badge'
import './general-instructor-application-list-item.css'

export type CalendarGeneralInstructorApplicationListRow = {
  id: string
  /** `buildResolvedColorMap` 조회용 */
  colorKey: string | number
  schoolName: string
  instructorName: string
  approvalStatus: ApprovalStatusKey
  sessionLabel: string
  distanceKm: number
  isNearDistance: boolean
  dispatchCount: number
  longDistanceCount: number
}

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
            거리 : {row.distanceKm}km
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
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
