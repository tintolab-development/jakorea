import { calendarListItemBackground } from '@/shared/components/calendar/lib/calendar-list-item-background'
import type { CSSProperties } from 'react'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import {
  settlementCalendarPrimaryTitle,
  type InstructorSettlementListRow,
} from '@/features/settlement-management/model/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { StatusOutlineTag } from '@/shared/components/status-outline-tag'

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

/**
 * 계좌 지급 확인(`pipe-program`) — Figma 14858:591093: 신청자명 Bold + 1px 세로선 + 프로그램명 회색.
 * 그 외 변형은 `settlementCalendarPrimaryTitle` 단일 문자열 (프로그램명 / 강사명 등).
 */
function renderSettlementListItemTitle(row: InstructorSettlementListRow) {
  const applicantName = row.instructorName?.trim()
  if (row.settlementListTitleVariant === 'pipe-program' && applicantName) {
    return (
      <div className="settlement-list-item__title settlement-list-item__title--split">
        <span className="settlement-list-item__title-name">{applicantName}</span>
        <span className="settlement-list-item__divider" aria-hidden />
        <span className="settlement-list-item__title-sub">{row.programName}</span>
      </div>
    )
  }
  return <div className="settlement-list-item__title">{settlementCalendarPrimaryTitle(row)}</div>
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
      className={[
        'calendar-list-item',
        'settlement-list-item',
        checked ? 'calendar-list-item--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          backgroundColor: calendarListItemBackground(colors.bg),
          border: `1px solid ${colors.border}`,
          '--settlement-list-card-bg': colors.bg,
          '--settlement-list-card-border': colors.border,
        } as CSSProperties
      }
    >
      <button type="button" className="settlement-list-item__open" onClick={() => onRowClick(row)}>
        {renderSettlementListItemTitle(row)}

        <div className="settlement-list-item__meta">
          <StatusOutlineTag label={badgeLabel} accentColor={statusStyle.color} />

          <span className="settlement-list-item__divider" aria-hidden />

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
        <CmsCheckbox checked={checked} onChange={e => onToggle(row.id, e.target.checked)} />
      </div>
    </div>
  )
}
