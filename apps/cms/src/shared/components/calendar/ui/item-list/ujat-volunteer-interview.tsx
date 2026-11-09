import { StatusOutlineTag } from '@/shared/components/status-outline-tag'
import { getUjatInterviewAssignmentTextPresentation } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'
import type { UjatInterviewAssignmentStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
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

/**
 * 1차 서류 합격자 캘린더 우측 카드 (Figma Calendar / List / Item 14894:26778).
 * 1행: 이름 | 면접 시간(말줄임) · 2행: 배정 현황 Tag | 면접 가능 일정 Count Tag
 */
export function CalendarListItemContentVolunteerInterview({
  row,
}: CalendarListItemContentVolunteerInterviewProps) {
  const slotSummary = row.slotSummary.trim()

  return (
    <div className="ujat-volunteer-interview-list-item">
      <div className="ujat-volunteer-interview-list-item__title-row">
        <span className="ujat-volunteer-interview-list-item__name" title={row.volunteerName}>
          {row.volunteerName}
        </span>
        {slotSummary ? (
          <>
            <span className="ujat-volunteer-interview-list-item__divider" aria-hidden />
            <span className="ujat-volunteer-interview-list-item__time" title={slotSummary}>
              {slotSummary}
            </span>
          </>
        ) : null}
      </div>
      <div className="ujat-volunteer-interview-list-item__tag-row">
        <StatusOutlineTag {...getUjatInterviewAssignmentTextPresentation(row.assignmentStatus)} />
        <span
          className="ujat-volunteer-interview-list-item__divider ujat-volunteer-interview-list-item__divider--tag"
          aria-hidden
        />
        <span className="ujat-volunteer-interview-list-item__count-tag">
          면접 가능 일정 : {Math.max(0, row.totalSlotCount)}개
        </span>
      </div>
    </div>
  )
}
