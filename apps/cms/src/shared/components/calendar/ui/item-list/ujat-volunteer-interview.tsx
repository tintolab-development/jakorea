import type { UjatInterviewAssignmentStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import './ujat-volunteer-interview-list-item.css'

export type CalendarVolunteerInterviewListRow = {
  /** 색상·클릭용 대표 이벤트 id */
  id: string
  volunteerName: string
  assignmentStatus: UjatInterviewAssignmentStatus
  slotLabels: string[]
}

const ASSIGNMENT_STATUS_LIST_LABELS: Record<UjatInterviewAssignmentStatus, string> = {
  waiting: '배정 전',
  assigned: '배정 완료',
  withdrawn: '활동 포기',
}

type CalendarListItemContentVolunteerInterviewProps = {
  row: CalendarVolunteerInterviewListRow
}

export function CalendarListItemContentVolunteerInterview({
  row,
}: CalendarListItemContentVolunteerInterviewProps) {
  const slotsText = row.slotLabels.join(', ')
  return (
    <div className="ujat-volunteer-interview-list-item">
      <div className="ujat-volunteer-interview-list-item__head">
        <span className="ujat-volunteer-interview-list-item__name">{row.volunteerName}</span>
        <span className="ujat-volunteer-interview-list-item__sep" aria-hidden>
          |
        </span>
        <span
          className={`ujat-volunteer-interview-list-item__status-badge ujat-volunteer-interview-list-item__status-badge--${row.assignmentStatus}`}
        >
          {ASSIGNMENT_STATUS_LIST_LABELS[row.assignmentStatus]}
        </span>
        <span className="ujat-volunteer-interview-list-item__schedule-badge">
          면접 가능 일정 : {row.slotLabels.length}개
        </span>
      </div>
      <div className="ujat-volunteer-interview-list-item__slots" title={slotsText}>
        {slotsText}
      </div>
    </div>
  )
}
