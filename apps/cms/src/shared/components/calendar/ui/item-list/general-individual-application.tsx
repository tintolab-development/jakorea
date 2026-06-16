import { Checkbox } from 'antd'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { CalendarApprovalStatusBadge } from './calendar-approval-status-badge'
import './general-individual-application-list-item.css'

export type CalendarGeneralIndividualApplicationListRow = {
  id: string
  /** `buildResolvedColorMap` 조회용 — 일별 이벤트 id */
  colorKey: string | number
  applicantName: string
  approvalStatus: ApprovalStatusKey
  regionLabel: string
  gradeLabel: string
  sessionLabel: string
}

type CalendarListItemContentGeneralIndividualApplicationProps = {
  row: CalendarGeneralIndividualApplicationListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}

export function CalendarListItemContentGeneralIndividualApplication({
  row,
  checked,
  onToggle,
}: CalendarListItemContentGeneralIndividualApplicationProps) {
  return (
    <div className="general-individual-application-list-item">
      <div className="general-individual-application-list-item__body">
        <div className="general-individual-application-list-item__title-row">
          <span className="general-individual-application-list-item__title">
            {row.applicantName}
          </span>
          <span className="general-individual-application-list-item__title-divider" aria-hidden />
          <CalendarApprovalStatusBadge status={row.approvalStatus} />
        </div>
        <div className="general-individual-application-list-item__meta">
          <span className="general-individual-application-list-item__meta-item">
            {row.regionLabel}
          </span>
          <span className="general-individual-application-list-item__title-divider" aria-hidden />
          <span className="general-individual-application-list-item__meta-item">{row.gradeLabel}</span>
          {row.sessionLabel !== '-' ? (
            <>
              <span className="general-individual-application-list-item__title-divider" aria-hidden />
              <span className="general-individual-application-list-item__meta-item general-individual-application-list-item__meta-item--session">
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
