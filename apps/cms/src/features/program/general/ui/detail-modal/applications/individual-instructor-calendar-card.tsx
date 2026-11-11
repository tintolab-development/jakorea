/**
 * 일반 개인형 강사 신청 캘린더 우측 카드 — 시안 03-1/01-2(9899:148010)
 * 「이름 | 승인 상태」 / 「차시(시간)」 / 거리·출강·장거리 태그 + 체크박스.
 * 스타일은 기관형 강사 신청 카드(`general-instructor-application-list-item`)와 같은 shell을 쓴다.
 */

import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from '@/shared/components/calendar/ui/item-list/calendar-approval-status-badge'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'

export type IndividualInstructorCalendarCardRow = {
  instructorName: string
  approvalStatus: ApprovalStatusKey
  sessionLabel: string
  distanceDisplay: string
  isNearDistance: boolean
  dispatchCount: number
  longDistanceCount: number
}

export function IndividualInstructorCalendarCard({
  row,
  checked,
  onToggle,
}: {
  row: IndividualInstructorCalendarCardRow
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <div className="general-instructor-application-list-item">
      <div className="general-instructor-application-list-item__body">
        <div className="general-instructor-application-list-item__header">
          <span className="general-instructor-application-list-item__school">
            {row.instructorName}
          </span>
          <span className="general-instructor-application-list-item__divider" aria-hidden />
          <CalendarApprovalStatusBadge status={row.approvalStatus} />
        </div>
        {row.sessionLabel !== '-' ? (
          <div className="general-instructor-application-list-item__session">
            <span className="general-instructor-application-list-item__round">
              {row.sessionLabel}
            </span>
          </div>
        ) : null}
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
        <CmsCheckbox checked={checked} onChange={e => onToggle(e.target.checked)} />
      </div>
    </div>
  )
}
