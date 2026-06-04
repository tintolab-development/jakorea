import { useCallback, useMemo } from 'react'
import { Checkbox, Empty } from 'antd'
import dayjs from 'dayjs'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from '@/shared/components/calendar/ui/item-list/calendar-approval-status-badge'
import {
  findInstitutionSessionForDate,
  getInstitutionCalendarSessionCardLabel,
  getInstitutionRegionShort,
} from './applicant-institution-calendar-session'
import './applicant-general-institution-calendar-schedule-list.css'

function approvalStatusModifier(status: ApprovalStatusKey | undefined): ApprovalStatusKey {
  if (status === 'approved' || status === 'rejected' || status === 'pending') {
    return status
  }
  return 'pending'
}

export type GeneralInstitutionCalendarScheduleListProps = {
  events: { id: string; startDate: string; originalItem?: unknown }[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onInstitutionClick: (institution: ApplicantSchoolRow) => void
}

export function GeneralInstitutionCalendarScheduleList({
  events,
  selectedRowKeys,
  onSelectionChange,
  onInstitutionClick,
}: GeneralInstitutionCalendarScheduleListProps) {
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
        events.length === 0
          ? 'calendar-list general-institution-calendar-list calendar-list--empty general-institution-calendar-list--empty'
          : 'calendar-list general-institution-calendar-list'
      }
    >
      {events.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        events.map(event => {
          const institution = event.originalItem as ApplicantSchoolRow | undefined
          if (!institution) return null

          const selectionKey =
            typeof institution.id === 'string' && institution.id ? institution.id : String(event.id)
          const isSelected = selectedSet.has(selectionKey)
          const status = approvalStatusModifier(
            institution.approvalStatus as ApprovalStatusKey | undefined
          )
          const schoolName = institution.schoolName?.trim() || '기관'
          const dateKey = dayjs(event.startDate).format('YYYY-MM-DD')
          const session = findInstitutionSessionForDate(institution, dateKey)
          const regionLabel = getInstitutionRegionShort(institution.region)
          const gradeLabel = institution.educationGrade?.trim() || '-'
          const sessionLabel = getInstitutionCalendarSessionCardLabel(
            session,
            institution.desiredEducationPeriod
          )

          return (
            <div
              key={event.id}
              className={[
                'general-institution-calendar-card',
                'calendar-list-item',
                `general-institution-calendar-card--${status}`,
                isSelected
                  ? 'calendar-list-item--selected general-institution-calendar-card--selected'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="general-institution-calendar-card__body"
                onClick={() => onInstitutionClick(institution)}
              >
                <div className="general-institution-calendar-card__header">
                  <span className="general-institution-calendar-card__school">{schoolName}</span>
                  <span className="general-institution-calendar-card__divider" aria-hidden />
                  <CalendarApprovalStatusBadge status={status} />
                </div>
                <div className="general-institution-calendar-card__meta">
                  <span className="general-institution-calendar-card__meta-item">{regionLabel}</span>
                  <span className="general-institution-calendar-card__divider" aria-hidden />
                  <span className="general-institution-calendar-card__meta-item">{gradeLabel}</span>
                  {sessionLabel !== '-' ? (
                    <>
                      <span className="general-institution-calendar-card__divider" aria-hidden />
                      <span className="general-institution-calendar-card__meta-item general-institution-calendar-card__meta-item--session">
                        {sessionLabel}
                      </span>
                    </>
                  ) : null}
                </div>
              </button>
              <div
                className="calendar-list-item__checkbox"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={e => handleToggle(selectionKey, e.target.checked)}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
