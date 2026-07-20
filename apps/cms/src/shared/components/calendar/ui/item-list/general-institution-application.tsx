import { Checkbox } from 'antd'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from './calendar-approval-status-badge'
import './general-institution-application-list-item.css'

export type CalendarGeneralInstitutionApplicationListRow = {
  id: string
  /** `buildResolvedColorMap` 조회용 — 일별 이벤트 id */
  colorKey: string | number
  institutionName: string
  approvalStatus: ApprovalStatusKey
  regionLabel: string
  gradeLabel: string
  sessionLabel: string
}

type CalendarListItemContentGeneralInstitutionApplicationProps = {
  row: CalendarGeneralInstitutionApplicationListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}

export function CalendarListItemContentGeneralInstitutionApplication({
  row,
  checked,
  onToggle,
}: CalendarListItemContentGeneralInstitutionApplicationProps) {
  return (
    <div className="general-institution-application-list-item">
      <div className="general-institution-application-list-item__body">
        <div className="general-institution-application-list-item__title-row">
          <span className="general-institution-application-list-item__title">
            {row.institutionName}
          </span>
          <span className="general-institution-application-list-item__title-divider" aria-hidden />
          <CalendarApprovalStatusBadge status={row.approvalStatus} />
        </div>
        <div className="general-institution-application-list-item__meta">
          <span className="general-institution-application-list-item__meta-item">
            {row.regionLabel}
          </span>
          <span className="general-institution-application-list-item__title-divider" aria-hidden />
          <span className="general-institution-application-list-item__meta-item">{row.gradeLabel}</span>
          {row.sessionLabel !== '-' ? (
            <>
              <span className="general-institution-application-list-item__title-divider" aria-hidden />
              <span className="general-institution-application-list-item__meta-item general-institution-application-list-item__meta-item--session">
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
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
