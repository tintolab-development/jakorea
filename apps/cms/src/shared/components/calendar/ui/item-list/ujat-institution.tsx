import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { InstitutionApplicationStatusBadge } from './institution-application-status-badge'
import './ujat-institution-item.css'

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
  checked?: boolean
  /** 없으면 체크박스를 그리지 않는다 (임시 배정 기관 확인·참여 기관 등 조회 전용 목록) */
  onToggle?: (key: string, checked: boolean) => void
}

export function CalendarListItemContentInstitutionApplication({
  row,
  checked = false,
  onToggle,
}: CalendarListItemContentInstitutionApplicationProps) {
  const statusLabel = row.statusLabel.trim()
  const totalClassSummary = row.totalClassSummary.trim()
  const gradeDetail = row.gradeDetail.trim()
  const hasMeta = totalClassSummary !== '' || gradeDetail !== ''

  return (
    <div className="ujat-institution-item">
      <div className="ujat-institution-item__body">
        <div className="ujat-institution-item__title-row">
          <span className="ujat-institution-item__title" title={row.institutionName}>
            {row.institutionName}
          </span>
          {statusLabel ? (
            <>
              <span className="ujat-institution-item__title-divider" aria-hidden />
              <InstitutionApplicationStatusBadge statusKey={row.statusKey} label={statusLabel} />
            </>
          ) : null}
        </div>
        {hasMeta ? (
          <div className="ujat-institution-item__meta">
            {totalClassSummary ? (
              <span className="ujat-institution-item__meta-total">{totalClassSummary}</span>
            ) : null}
            {totalClassSummary && gradeDetail ? (
              <span className="ujat-institution-item__meta-divider" aria-hidden />
            ) : null}
            {gradeDetail ? (
              <span className="ujat-institution-item__meta-detail" title={gradeDetail}>
                {gradeDetail}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {onToggle ? (
        <div
          className="calendar-list-item__checkbox"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <CmsCheckbox
            aria-label={`${row.institutionName} 선택`}
            checked={checked}
            onChange={e => onToggle(row.id, e.target.checked)}
          />
        </div>
      ) : null}
    </div>
  )
}
