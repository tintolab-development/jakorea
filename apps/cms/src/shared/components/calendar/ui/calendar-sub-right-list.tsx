import { useCallback, useMemo, type ComponentType } from 'react'
import { Empty } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import { CalendarListItemContentProgram } from './item-list/program'
import { CalendarListItemContentSettlement } from './item-list/settlement'
import { settlementEventStatusColorPair } from './preview-tooltip/settlement'
import {
  PROGRAM_DAY_SCHEDULE_STATUS_CONFIG,
  getProgramDayScheduleEventStatus,
  getProgramDayScheduleEventTime,
} from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

type CalendarListItemProgramProps = {
  title?: string
  label: string
  time: string
}

export type CalendarSubRightListProps = {
  selectedDate: Dayjs
  items: Program[]
  onItemClick: (item: Program) => void
  listItem?: ComponentType<CalendarListItemProgramProps>
}

function CalendarSubRightProgramList({
  selectedDate,
  items,
  onItemClick,
  listItem: ListItem = CalendarListItemContentProgram,
}: {
  selectedDate: Dayjs
  items: Program[]
  onItemClick: (item: Program) => void
  listItem?: ComponentType<CalendarListItemProgramProps>
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
                <ListItem title={program.title} label={config.label} time={time} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function CalendarSubRightList(props: CalendarSubRightListProps) {
  const { selectedDate, items, onItemClick, listItem = CalendarListItemContentProgram } = props
  return (
    <CalendarSubRightProgramList
      selectedDate={selectedDate}
      items={items}
      onItemClick={onItemClick}
      listItem={listItem}
    />
  )
}

export type CalendarSubRightSettlementListProps = {
  selectedDate: Dayjs
  rows: InstructorSettlementListRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onRowClick: (row: InstructorSettlementListRow) => void
  resolveRowColors?: (row: InstructorSettlementListRow) => ScheduleColorPair | undefined
  resolveBadgeLabel?: (row: InstructorSettlementListRow) => string | undefined
}

export function CalendarSubRightSettlementList({
  selectedDate,
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
  resolveBadgeLabel,
}: CalendarSubRightSettlementListProps) {
  const dayRows = useMemo(() => {
    return rows.filter(row => dayjs(row.calendarDate).isSame(selectedDate, 'day'))
  }, [rows, selectedDate])

  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: React.Key, checked: boolean) => {
      const id = String(key)
      if (checked) {
        if (selectedSet.has(id)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== id))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <div className="calendar-list settlement-list-item-list">
      {dayRows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 정산이 없습니다" />
      ) : (
        dayRows.map(row => {
          const colors = resolveRowColors?.(row) ?? settlementEventStatusColorPair(row.status)
          const tagStyle = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[row.status]
          const badgeLabel = resolveBadgeLabel?.(row) ?? INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[row.status]

          return (
            <CalendarListItemContentSettlement
              key={row.id}
              row={row}
              checked={selectedSet.has(row.id)}
              colors={colors}
              badgeLabel={badgeLabel}
              statusStyle={{ color: tagStyle.color }}
              onRowClick={onRowClick}
              onToggle={handleToggle}
            />
          )
        })
      )}
    </div>
  )
}
