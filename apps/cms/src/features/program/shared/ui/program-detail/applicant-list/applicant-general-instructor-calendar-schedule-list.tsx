import { useCallback, useMemo } from 'react'
import { Checkbox, Empty } from 'antd'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from '@/shared/components/calendar/ui/item-list/calendar-approval-status-badge'
import { getInstructorCalendarSessionCardLabel } from './applicant-instructor-calendar-session'
import {
  getInstructorScheduleDispatchStats,
  getInstructorScheduleDistanceKm,
} from './applicant-instructor-schedule-meta'
import './applicant-general-instructor-calendar-schedule-list.css'

type InstructorCalendarCard = {
  id: string
  schoolName: string
  instructor: ApplicantInstructorRow
}

function flattenInstructorCalendarCards(
  events: { id: string; originalItem?: unknown }[]
): InstructorCalendarCard[] {
  const cards: InstructorCalendarCard[] = []
  for (const event of events) {
    const originalItem = event.originalItem as Record<string, unknown> | undefined
    if (!originalItem) continue
    const schoolName = String(originalItem.schoolName ?? '').trim() || '기관'
    const institutionRows = originalItem.calendarInstitutionInstructors as
      | ApplicantInstructorRow[]
      | undefined
    if (institutionRows?.length) {
      for (const inst of institutionRows) {
        cards.push({ id: String(inst.id), schoolName, instructor: inst })
      }
      continue
    }
    if (typeof originalItem.instructorName === 'string') {
      cards.push({
        id: String(event.id),
        schoolName,
        instructor: originalItem as unknown as ApplicantInstructorRow,
      })
    }
  }
  return cards
}

function approvalStatusModifier(status: ApprovalStatusKey | undefined): ApprovalStatusKey {
  if (status === 'approved' || status === 'rejected' || status === 'pending') {
    return status
  }
  return 'pending'
}

export type GeneralInstructorCalendarScheduleListProps = {
  events: { id: string; originalItem?: unknown }[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onInstructorClick: (instructor: ApplicantInstructorRow) => void
}

export function GeneralInstructorCalendarScheduleList({
  events,
  selectedRowKeys,
  onSelectionChange,
  onInstructorClick,
}: GeneralInstructorCalendarScheduleListProps) {
  const cards = useMemo(() => flattenInstructorCalendarCards(events), [events])
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(id)) return
        onSelectionChange([...selectedRowKeys, id])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== id))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <div
      className={
        cards.length === 0
          ? 'calendar-list general-instructor-calendar-list calendar-list--empty general-instructor-calendar-list--empty'
          : 'calendar-list general-instructor-calendar-list'
      }
    >
      {cards.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        cards.map(({ id, schoolName, instructor }) => {
          const status = approvalStatusModifier(
            instructor.approvalStatus as ApprovalStatusKey | undefined
          )
          const isSelected = selectedSet.has(id)
          const instructorName = instructor.instructorName || '-'
          const sessionLabel = getInstructorCalendarSessionCardLabel(instructor, schoolName)
          const distanceKm = getInstructorScheduleDistanceKm(
            schoolName,
            instructorName,
            instructor.address
          )
          const { dispatchCount, longDistanceCount } =
            getInstructorScheduleDispatchStats(instructorName)

          return (
            <div
              key={id}
              className={[
                'general-instructor-calendar-card',
                'calendar-list-item',
                `general-instructor-calendar-card--${status}`,
                isSelected
                  ? 'calendar-list-item--selected general-instructor-calendar-card--selected'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="general-instructor-calendar-card__body"
                onClick={() => onInstructorClick(instructor)}
              >
                <div className="general-instructor-calendar-card__header">
                  <span className="general-instructor-calendar-card__school">{schoolName}</span>
                  <span className="general-instructor-calendar-card__divider" aria-hidden />
                  <CalendarApprovalStatusBadge status={status} />
                </div>
                <div className="general-instructor-calendar-card__session">
                  <span className="general-instructor-calendar-card__instructor">
                    {instructorName}
                  </span>
                  {sessionLabel !== '-' ? (
                    <>
                      <span className="general-instructor-calendar-card__divider" aria-hidden />
                      <span className="general-instructor-calendar-card__round">{sessionLabel}</span>
                    </>
                  ) : null}
                </div>
                <div className="general-instructor-calendar-card__tags">
                  <span className="general-instructor-calendar-card__tag general-instructor-calendar-card__tag--mint">
                    거리 : {distanceKm}km
                  </span>
                  <span className="general-instructor-calendar-card__tag">
                    출강 : {dispatchCount}회
                  </span>
                  <span className="general-instructor-calendar-card__tag">
                    장거리 : {longDistanceCount}회
                  </span>
                </div>
              </button>
              <div
                className="calendar-list-item__checkbox"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
              >
                <Checkbox checked={isSelected} onChange={e => handleToggle(id, e.target.checked)} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
