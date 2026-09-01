import type { CSSProperties } from 'react'
import { Checkbox } from 'antd'
import {
  settlementCalendarPrimaryTitle,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'

import './settlement-list-item.css'

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
      className="settlement-list-item"
      style={
        {
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          '--settlement-list-card-bg': colors.bg,
          '--settlement-list-card-border': colors.border,
        } as CSSProperties
      }
    >
      <button type="button" className="settlement-list-item__open" onClick={() => onRowClick(row)}>
        <div className="settlement-list-item__title">{settlementCalendarPrimaryTitle(row)}</div>

        <div className="settlement-list-item__meta">
          <span
            className="settlement-list-item__badge"
            style={{
              color: statusStyle.color,
              borderColor: statusStyle.color,
            }}
          >
            {badgeLabel}
          </span>

          <span className="settlement-list-item__meta-sep" aria-hidden>
            |
          </span>

          <span className="settlement-list-item__amount">
            +{row.scheduledAmount.toLocaleString()}원
          </span>
        </div>
      </button>

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
