import { useMemo, useRef, useLayoutEffect, useCallback, type CSSProperties } from 'react'
import { Checkbox, Empty } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  PROGRAM_DAY_SCHEDULE_STATUS_CONFIG,
  getProgramDayScheduleEventStatus,
  getProgramDayScheduleEventTime,
} from '@/entities/program/lib/program-day-schedule-line'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 우측 일정 카드 하단 배지 문구 (강사 정산) */
const INSTRUCTOR_SETTLEMENT_LIST_BADGE_LABEL: Record<
  InstructorSettlementListRow['status'],
  string
> = {
  awaiting_confirmation: '확인 대기',
  partial_confirmation: '일부 확인',
  payment_statement_verified: '확인 완료',
  account_paid: '계좌 지급',
  none: '해당 없음',
  application_rejected: '반려',
  payment_correction_requested: '정정 요청',
}

function statusToSettlementColor(status: InstructorSettlementListRow['status']): ScheduleColorPair {
  const style = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status]
  return {
    name: 'gray',
    text: style.color,
    border: style.border,
    bg: style.bg,
  } as ScheduleColorPair
}

/** 세로 스크롤이 가능한 조상(모달 `__main` 등) — fixed 패널 위치를 스크롤에 맞추기 위해 구독 */
function getVerticalScrollAncestors(start: HTMLElement | null): HTMLElement[] {
  const list: HTMLElement[] = []
  let el: HTMLElement | null = start?.parentElement ?? null
  while (el) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      list.push(el)
    }
    el = el.parentElement
  }
  return list
}

function InstructorSettlementScheduleList({
  selectedDate,
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
}: {
  selectedDate: Dayjs
  rows: InstructorSettlementListRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onRowClick: (row: InstructorSettlementListRow) => void
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  const toggleKey = (key: React.Key, checked: boolean) => {
    if (checked) onSelectionChange([...selectedRowKeys, key])
    else onSelectionChange(selectedRowKeys.filter(k => k !== key))
  }

  const syncFloatingPanel = useCallback(() => {
    const slot = slotRef.current
    const panel = panelRef.current
    if (!slot || !panel) return
    const r = slot.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    const minTop = 0
    const top = Math.max(minTop, r.top)
    panel.style.position = 'fixed'
    panel.style.left = `${r.left}px`
    panel.style.top = `${top}px`
    panel.style.width = `${r.width}px`
    panel.style.height = `${r.height}px`
    panel.style.zIndex = '1100'
    panel.style.boxSizing = 'border-box'
    panel.style.margin = '0'
  }, [])

  const scheduleSync = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(syncFloatingPanel)
  }, [syncFloatingPanel])

  useLayoutEffect(() => {
    const slot = slotRef.current
    if (!slot) return
    const scrollRoots = getVerticalScrollAncestors(slot)
    const ro = new ResizeObserver(scheduleSync)
    ro.observe(slot)
    for (const root of scrollRoots) {
      root.addEventListener('scroll', scheduleSync, { passive: true })
    }
    window.addEventListener('resize', scheduleSync)
    window.addEventListener('scroll', scheduleSync, { passive: true, capture: true })
    scheduleSync()
    return () => {
      ro.disconnect()
      for (const root of scrollRoots) {
        root.removeEventListener('scroll', scheduleSync)
      }
      window.removeEventListener('resize', scheduleSync)
      window.removeEventListener('scroll', scheduleSync, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [scheduleSync, selectedDate, rows.length, selectedRowKeys.length])

  const listInner = (
    <div className="applicant-schedule-list instructor-settlement-schedule-list">
      <div className="applicant-schedule-list-content">
        {rows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`${selectedDate.format('YYYY.MM.DD')} 정산 일정이 없습니다.`}
          />
        ) : (
          rows.map(row => {
            const st = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[row.status]
            const badgeLabel = INSTRUCTOR_SETTLEMENT_LIST_BADGE_LABEL[row.status]
            const checked = selectedRowKeys.includes(row.id)
            const colors = statusToSettlementColor(row.status)
            return (
              <div
                key={row.id}
                className={`applicant-schedule-item instructor-settlement-schedule-item ${checked ? 'applicant-schedule-item--selected instructor-settlement-schedule-item--selected' : ''}`}
                style={
                  {
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    '--instructor-settlement-card-bg': colors.bg,
                    '--instructor-settlement-card-border': colors.border,
                  } as CSSProperties
                }
              >
                <button
                  type="button"
                  className="applicant-schedule-item-info instructor-settlement-schedule-item__open instructor-payment-schedule-list__open"
                  onClick={() => onRowClick(row)}
                >
                  <div className="instructor-settlement-schedule-item__title">
                    [{row.programName}]
                  </div>
                  <div className="instructor-settlement-schedule-item__meta">
                    <span
                      className="instructor-settlement-schedule-item__badge"
                      style={{
                        color: st.color,
                        borderColor: st.color,
                      }}
                    >
                      {badgeLabel}
                    </span>
                    <span className="instructor-settlement-schedule-item__meta-sep" aria-hidden>
                      |
                    </span>
                    <span className="instructor-settlement-schedule-item__amount">
                      +{row.scheduledAmount.toLocaleString()}원
                    </span>
                  </div>
                </button>
                <div
                  className="applicant-schedule-item-checkbox instructor-settlement-schedule-item__checkbox"
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

  return (
    <>
      <div
        ref={slotRef}
        className="applicant-calendar-right instructor-settlement-schedule-list__slot"
        aria-hidden
      />
      <div
        ref={panelRef}
        className="applicant-calendar-right instructor-settlement-schedule-list__floating-panel"
      >
        {listInner}
      </div>
    </>
  )
}

export type CalendarSubRightListProps =
  | {
      selectedDate: Dayjs
      items: Program[]
      onItemClick: (item: Program) => void
    }
  | {
      selectedDate: Dayjs
      rows: InstructorSettlementListRow[]
      selectedRowKeys: React.Key[]
      onSelectionChange: (keys: React.Key[]) => void
      onRowClick: (row: InstructorSettlementListRow) => void
    }

function isInstructorSettlementProps(
  p: CalendarSubRightListProps
): p is Extract<CalendarSubRightListProps, { rows: InstructorSettlementListRow[] }> {
  return 'rows' in p
}

function CalendarSubRightProgramList({
  selectedDate,
  items,
  onItemClick,
}: {
  selectedDate: Dayjs
  items: Program[]
  onItemClick: (item: Program) => void
}) {
  const dayPrograms = useMemo(() => {
    return items.filter(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      const isInEducationPeriod =
        selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')

      let isInApplicationPeriod = false
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        isInApplicationPeriod =
          selectedDate.isSameOrAfter(appStart, 'day') && selectedDate.isSameOrBefore(appEnd, 'day')
      }

      return isInEducationPeriod || isInApplicationPeriod
    })
  }, [items, selectedDate])

  const scheduleListColorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(dayPrograms),
    [dayPrograms]
  )

  return (
    <div className="calendar-list">
      {dayPrograms.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        dayPrograms.map(program => {
          const status = getProgramDayScheduleEventStatus(program, selectedDate)
          const time = getProgramDayScheduleEventTime(program, selectedDate)
          const config = PROGRAM_DAY_SCHEDULE_STATUS_CONFIG[status]
          const color = scheduleListColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]

          return (
            <div
              key={program.id}
              className="calendar-list-item"
              data-has-color="true"
              style={{
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
              }}
              onClick={() => onItemClick(program)}
            >
              <div className="calendar-list-item__column">
                <div className="calendar-list-item__head" title={program.title ?? ''}>
                  {program.title ?? ''}
                </div>
                <div className="calendar-list-item__desc">
                  <span>{config.label}</span>
                  <span>| {time}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function CalendarSubRightList(props: CalendarSubRightListProps) {
  if (isInstructorSettlementProps(props)) {
    const { selectedDate, rows, selectedRowKeys, onSelectionChange, onRowClick } = props
    return (
      <InstructorSettlementScheduleList
        selectedDate={selectedDate}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
      />
    )
  }

  const { selectedDate, items, onItemClick } = props
  return (
    <CalendarSubRightProgramList
      selectedDate={selectedDate}
      items={items}
      onItemClick={onItemClick}
    />
  )
}
