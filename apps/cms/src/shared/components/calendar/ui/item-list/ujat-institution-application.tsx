import { Checkbox } from 'antd'
import { UjatInstitutionApplicationStatusBadge } from './ujat-institution-application-status-badge'
import './ujat-institution-application-list-item.css'

export type CalendarInstitutionApplicationListRow = {
  id: string
  institutionName: string
  statusLabel: string
  statusKey: string
  /** 예: 총 17개 학급 */
  totalClassSummary: string
  /** 예: 2학년 7학급, 3학년 5학급 — 길면 말줄임 */
  gradeDetail: string
}

type CalendarListItemContentInstitutionApplicationProps = {
  row: CalendarInstitutionApplicationListRow
  checked: boolean
  onToggle: (key: string, checked: boolean) => void
}

export function CalendarListItemContentInstitutionApplication({
  row,
  checked,
  onToggle,
}: CalendarListItemContentInstitutionApplicationProps) {
  return (
    <div className="ujat-institution-application-list-item">
      <div className="ujat-institution-application-list-item__body">
        <div className="ujat-institution-application-list-item__title-row">
          <span className="ujat-institution-application-list-item__title">
            {row.institutionName}
          </span>
          <span className="ujat-institution-application-list-item__title-divider" aria-hidden>
            |
          </span>
          <UjatInstitutionApplicationStatusBadge statusKey={row.statusKey} label={row.statusLabel} />
        </div>
        <div className="ujat-institution-application-list-item__meta">
          <span className="ujat-institution-application-list-item__meta-total">
            {row.totalClassSummary}
          </span>
          {row.gradeDetail ? (
            <>
              <span className="ujat-institution-application-list-item__meta-divider" aria-hidden>
                |
              </span>
              <span
                className="ujat-institution-application-list-item__meta-detail"
                title={row.gradeDetail}
              >
                {row.gradeDetail}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div
        className="ujat-institution-application-list-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
