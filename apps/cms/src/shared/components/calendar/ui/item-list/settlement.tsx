import type { CSSProperties } from 'react'
import { Checkbox } from 'antd'
import type { InstructorSettlementListRow } from '@/data/mock/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'

import './settlement-preview-item.css'

type CalendarListItemContentSettlementProps = {
  row: InstructorSettlementListRow
  checked: boolean
  colors: ScheduleColorPair
  badgeLabel: string
  statusStyle: {
    color: string
  }
  onRowClick: (row: InstructorSettlementListRow) => void
  onToggle: (key: React.Key, checked: boolean) => void
}

export function CalendarListItemContentSettlement({
  row,
  checked,
  colors,
  badgeLabel,
  statusStyle,
  onRowClick,
  onToggle,
}: CalendarListItemContentSettlementProps) {
  return (
    <div
      className={`settlement-preview-item${checked ? ' settlement-preview-item--selected' : ''}`}
      style={
        {
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          '--settlement-preview-card-bg': colors.bg,
          '--settlement-preview-card-border': colors.border,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="settlement-preview-item__open"
        onClick={() => onRowClick(row)}
      >
        <div className="settlement-preview-item__title">[{row.programName}]</div>

        <div className="settlement-preview-item__meta">
          <span
            className="settlement-preview-item__badge"
            style={{
              color: statusStyle.color,
              borderColor: statusStyle.color,
            }}
          >
            {badgeLabel}
          </span>

          <span className="settlement-preview-item__meta-sep" aria-hidden>
            |
          </span>

          <span className="settlement-preview-item__amount">
            +{row.scheduledAmount.toLocaleString()}원
          </span>
        </div>
      </button>

      <div
        className="settlement-preview-item__checkbox"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Checkbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
