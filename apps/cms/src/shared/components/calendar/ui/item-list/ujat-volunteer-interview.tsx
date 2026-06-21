import {
  UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  type UjatInterviewAssignmentStatus,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import './ujat-volunteer-interview-list-item.css'

export type CalendarVolunteerInterviewListRow = {
  /** 색상·클릭용 대표 이벤트 id */
  id: string
  volunteerName: string
  assignmentStatus: UjatInterviewAssignmentStatus
  slotLabels: string[]
  /** 선택된 날짜 기준 가장 빠른 신청 시간 + 외 N개 */
  slotSummary: string
  /** 봉사자가 신청한 전체 면접 가능 일정 수 */
  totalSlotCount: number
}

type CalendarListItemContentVolunteerInterviewProps = {
  row: CalendarVolunteerInterviewListRow
}

export function CalendarListItemContentVolunteerInterview({
  row,
}: CalendarListItemContentVolunteerInterviewProps) {
  return (
    <div className="ujat-volunteer-interview-list-item">
      <div className="ujat-volunteer-interview-list-item__title-row">
        <span className="ujat-volunteer-interview-list-item__name">{row.volunteerName}</span>
        <span className="ujat-volunteer-interview-list-item__sep" aria-hidden>
          |
        </span>
        <span className="ujat-volunteer-interview-list-item__time">{row.slotSummary}</span>
      </div>
      <div className="ujat-volunteer-interview-list-item__tag-row">
        <span
          className={`ujat-volunteer-interview-list-item__status-badge ujat-volunteer-interview-list-item__status-badge--${row.assignmentStatus}`}
        >
          {UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus]}
        </span>
        <span className="ujat-volunteer-interview-list-item__schedule-badge">
          면접 가능 일정 수 : {row.totalSlotCount}개
        </span>
      </div>
    </div>
  )
}
