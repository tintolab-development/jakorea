import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  settlementCalendarPrimaryTitle,
  type InstructorSettlementListRow,
} from '@/features/settlement-management/model/instructor-member-settlements'
import type { CalendarItem } from '../../model/calendar-item'

import './settlement-preview-tooltip.css'

export function settlementRowFromCalendarItem(item: CalendarItem): InstructorSettlementListRow {
  const o = item.original
  if (o != null && typeof o === 'object' && 'originalItem' in o) {
    return (o as { originalItem: InstructorSettlementListRow }).originalItem
  }
  throw new Error('settlementRowFromCalendarItem: expected event with originalItem')
}

export function settlementEventStatusColorPair(
  status: InstructorSettlementListRow['status']
): ScheduleColorPair {
  const style = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status]
  return {
    name: 'gray',
    text: style.color,
    border: style.border,
    bg: style.bg,
  }
}

/**
 * 미리보기 툴팁 세그먼트 구분선 — Figma Calendar / List / Preview(14858:590633·591061) `line` 1×12.
 * 문자 `|` 금지(`table-td-divider.mdc`). 크기·색은 `settlement-preview-tooltip.css` `__sep`.
 */
export function SettlementPreviewTooltipSep() {
  return <span className="settlement-preview-tooltip__sep" aria-hidden />
}

/** `CalendarMain` 이벤트 모드 `previewTooltipContent`용 */
export function renderSettlementEventsTooltipContent({
  events: dayEvents,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="settlement-preview-tooltip">
      {dayEvents.map(ev => {
        const row = settlementRowFromCalendarItem(ev)
        const colors = settlementEventStatusColorPair(row.status)
        return (
          <div key={String(ev.id)} className="instructor-settlement-preview">
            <div className="instructor-settlement-preview__title">
              {settlementCalendarPrimaryTitle(row)}
            </div>
            <div className="settlement-preview-tooltip__row">
              <span style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>
                {INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[row.status]}
              </span>
              <SettlementPreviewTooltipSep />
              <span className="settlement-preview-tooltip__text">
                +{row.scheduledAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
