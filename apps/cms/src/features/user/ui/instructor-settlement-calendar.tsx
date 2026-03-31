/**
 * 강사 정산 현황 — 신청 강사 캘린더 레이아웃·CSS 재사용 (월 뷰만)
 */

import { useRef, useMemo, useLayoutEffect, useCallback } from 'react'
import { Calendar, Button, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Checkbox, Empty } from 'antd'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import type { ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'
import '@/features/program/ui/detail-modal/applicants/applicant-calendar-view.css'
import './instructor-settlement-calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface SettlementCalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
}

function statusToColor(status: InstructorSettlementListRow['status']): ScheduleColorPair {
  const style = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status]
  return {
    name: 'gray',
    text: style.color,
    border: style.border,
    bg: style.bg,
  } as ScheduleColorPair
}

interface InstructorSettlementScheduleListProps {
  selectedDate: Dayjs
  rows: InstructorSettlementListRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onRowClick: (row: InstructorSettlementListRow) => void
}

function InstructorSettlementScheduleList({
  selectedDate,
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
}: InstructorSettlementScheduleListProps) {
  const toggleKey = (key: React.Key, checked: boolean) => {
    if (checked) onSelectionChange([...selectedRowKeys, key])
    else onSelectionChange(selectedRowKeys.filter(k => k !== key))
  }

  return (
    <div className="applicant-schedule-list">
      <div className="applicant-schedule-list-content">
        {rows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`${selectedDate.format('YYYY.MM.DD')} 정산 일정이 없습니다.`}
          />
        ) : (
          rows.map(row => {
            const st = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[row.status]
            const label = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[row.status]
            const checked = selectedRowKeys.includes(row.id)
            const colors = statusToColor(row.status)
            return (
              <div
                key={row.id}
                className={`applicant-schedule-item ${checked ? 'applicant-schedule-item--selected' : ''}`}
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <button
                  type="button"
                  className="applicant-schedule-item-info instructor-payment-schedule-list__open"
                  onClick={() => onRowClick(row)}
                >
                  <div className="applicant-schedule-item-title-row">
                    <span className="applicant-schedule-item-title" style={{ color: st.color }}>
                      {label}
                    </span>
                    <span className="applicant-schedule-item-title-divider" aria-hidden>
                      |
                    </span>
                    <span className="applicant-schedule-item-title">
                      +{row.scheduledAmount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="applicant-schedule-item-session" style={{ marginBottom: 0 }}>
                    {row.programName}
                  </div>
                </button>
                <div
                  className="applicant-schedule-item-checkbox"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                >
                  <Checkbox checked={checked} onChange={e => toggleKey(row.id, e.target.checked)} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export interface InstructorSettlementCalendarViewProps {
  events: SettlementCalendarEvent[]
  currentMonth: Dayjs
  /** 표시 월만 변경 (날짜 셀에서 타월 선택 시 — 선택일은 그대로) */
  onDisplayMonthChange: (d: Dayjs) => void
  /** 헤더 화살표: 월 이동 + 선택일을 해당 월 1일로 */
  onMonthStep: (deltaMonths: number) => void
  selectedDate: Dayjs
  onSelectedDateChange: (d: Dayjs) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onSettlementClick: (row: InstructorSettlementListRow) => void
}

export function InstructorSettlementCalendarView({
  events,
  currentMonth,
  onDisplayMonthChange,
  onMonthStep,
  selectedDate,
  onSelectedDateChange,
  selectedRowKeys,
  onSelectionChange,
  onSettlementClick,
}: InstructorSettlementCalendarViewProps) {
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const getEventsForDate = useCallback(
    (date: Dayjs): SettlementCalendarEvent[] =>
      events.filter(event => {
        const start = dayjs(event.startDate)
        const end = dayjs(event.endDate)
        return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      }),
    [events]
  )

  const dayRows = useMemo(() => {
    const evs = getEventsForDate(selectedDate)
    return evs.map(e => e.originalItem)
  }, [getEventsForDate, selectedDate])

  useLayoutEffect(() => {
    const main = mainCalendarRef.current
    if (!main) return
    const ROWS = 6
    const MIN_ROW = 124.2
    const BOTTOM_RESERVE = 12
    const applyMonthRowHeight = () => {
      const thead = main.querySelector('.ant-picker-content thead')
      if (!thead) {
        main.style.removeProperty('--applicant-cal-row-height')
        return
      }
      const mainRect = main.getBoundingClientRect()
      const padBottom = parseFloat(getComputedStyle(main).paddingBottom) || 0
      const innerBottom = mainRect.bottom - padBottom
      const tbodyTop = thead.getBoundingClientRect().bottom
      const forBody = Math.max(0, innerBottom - tbodyTop - BOTTOM_RESERVE)
      const rowPx = Math.max(MIN_ROW, forBody / ROWS)
      main.style.setProperty('--applicant-cal-row-height', `${Math.round(rowPx * 10) / 10}px`)
    }
    const ro = new ResizeObserver(() => requestAnimationFrame(applyMonthRowHeight))
    ro.observe(main)
    const parent = main.parentElement
    if (parent) ro.observe(parent)
    requestAnimationFrame(applyMonthRowHeight)
    return () => {
      ro.disconnect()
      main.style.removeProperty('--applicant-cal-row-height')
    }
  }, [currentMonth])

  const handleDateSelect = (date: Dayjs) => {
    onSelectedDateChange(date)
    if (!date.isSame(currentMonth, 'month')) {
      onDisplayMonthChange(date.startOf('month'))
    }
  }

  const dateFullCellRender = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayEvents = getEventsForDate(date)
    const hasEvents = dayEvents.length > 0

    /* 캘린더 셀 한칸 스타일 */
    const cellBody = (
      <>
        <div className="applicant-calendar-cell-date">
          <span className={isSelected ? 'applicant-calendar-cell-date-selected' : ''}>
            {date.date()}
          </span>
        </div>
        {hasEvents && (
          <div className="applicant-calendar-cell-events">
            {dayEvents.slice(0, 2).map(event => {
              const row = event.originalItem
              const colors = statusToColor(row.status)
              const short = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[row.status]
              return (
                <div
                  key={event.id}
                  className="applicant-calendar-event"
                  style={{
                    backgroundColor: colors.bg,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="applicant-calendar-event-title" style={{ color: colors.text }}>
                    +{row.scheduledAmount.toLocaleString()}원 | {short}
                  </span>
                </div>
              )
            })}
            {dayEvents.length > 2 && (
              <div className="applicant-calendar-event-more">외 {dayEvents.length - 2}건</div>
            )}
          </div>
        )}
      </>
    )

    /* 툴팁 스타일 */
    const tooltipTitle = (
      <div className="applicant-calendar-popover">
        {dayEvents.map(ev => {
          const row = ev.originalItem
          const colors = statusToColor(row.status)
          return (
            <div key={ev.id} className="applicant-calendar-popover__row">
              <div className="applicant-calendar-popover__title">[{row.programName}]</div>
              <div>
                <span style={{ color: colors.text }}>
                  {INSTRUCTOR_SETTLEMENT_STATUS_LABELS[row.status]}
                </span>
                <span className="applicant-calendar-popover__text">
                  <span className="applicant-calendar-popover__sep">|</span> +
                  {row.scheduledAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )

    return (
      <div
        className={`applicant-calendar-cell ${!isCurrentMonth ? 'applicant-calendar-cell--other-month' : ''} ${isSelected ? 'applicant-calendar-cell--selected' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        {hasEvents ? (
          <Tooltip
            arrow={false}
            overlayClassName="applicant-calendar-tooltip-overlay applicant-calendar-tooltip-overlay--settlement"
            title={tooltipTitle}
            placement="bottomLeft"
            mouseEnterDelay={0.15}
            destroyTooltipOnHide
          >
            <div className="applicant-calendar-cell-tooltip-trigger">{cellBody}</div>
          </Tooltip>
        ) : (
          cellBody
        )}
      </div>
    )
  }

  return (
    <div className="applicant-calendar-layout">
      <div className="applicant-calendar-main" ref={mainCalendarRef}>
        <div className="applicant-calendar-header">
          <div className="applicant-calendar-header-left">
            <span className="applicant-calendar-header-title">
              {currentMonth.format('YYYY. MM')}
            </span>
            <div className="applicant-calendar-nav">
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                className="applicant-calendar-nav-btn"
                onClick={() => onMonthStep(-1)}
              />
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                className="applicant-calendar-nav-btn"
                onClick={() => onMonthStep(1)}
              />
            </div>
          </div>
        </div>
        <Calendar
          value={currentMonth}
          fullCellRender={dateFullCellRender}
          headerRender={() => null}
        />
      </div>
      <div className="applicant-calendar-right">
        <InstructorSettlementScheduleList
          selectedDate={selectedDate}
          rows={dayRows}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onRowClick={onSettlementClick}
        />
      </div>
    </div>
  )
}
