import { useCallback, useMemo, type ComponentType, type Key, type ReactNode } from 'react'
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
import { CalendarListItemContentGeneralProgramEvent } from './item-list/general-program-event'
import { CalendarListItemContentSettlement } from './item-list/settlement'
import {
  CalendarListItemContentInstitutionApplication,
  type CalendarInstitutionApplicationListRow,
} from './item-list/ujat-institution-application'
import {
  CalendarListItemContentGeneralInstitutionApplication,
  type CalendarGeneralInstitutionApplicationListRow,
} from './item-list/general-institution-application'
import {
  CalendarListItemContentGeneralInstructorApplication,
  type CalendarGeneralInstructorApplicationListRow,
} from './item-list/general-instructor-application'
import {
  CalendarListItemContentGeneralIndividualApplication,
  type CalendarGeneralIndividualApplicationListRow,
} from './item-list/general-individual-application'
import {
  CalendarListItemContentVolunteerInterview,
  type CalendarVolunteerInterviewListRow,
} from './item-list/ujat-volunteer-interview'
import {
  CalendarListItemContentVolunteerInterview2,
  type CalendarVolunteerInterview2ListRow,
} from './item-list/ujat-volunteer-interview2'
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
} from '@/features/program/shared/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

type CalendarListItemProgramProps = {
  title?: string
  label: string
  time: string
}

export type CalendarSubRightListProgramProps = {
  mode?: 'program'
  selectedDate: Dayjs
  items: Program[]
  onItemClick: (item: Program) => void
  listItem?: ComponentType<CalendarListItemProgramProps>
}

export type CalendarSubRightListInstitutionApplicationProps = {
  mode: 'institutionApplication'
  selectedDate: Dayjs
  rows: CalendarInstitutionApplicationListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  resolveRowColors?: (row: CalendarInstitutionApplicationListRow) => ScheduleColorPair | undefined
}

export type CalendarSubRightListProps =
  | CalendarSubRightListProgramProps
  | CalendarSubRightListInstitutionApplicationProps

function isInstitutionApplicationListProps(
  props: CalendarSubRightListProps
): props is CalendarSubRightListInstitutionApplicationProps {
  return props.mode === 'institutionApplication'
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
    <div className={dayPrograms.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
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

function CalendarSubRightInstitutionApplicationList({
  rows,
  selectedRowKeys,
  onSelectionChange,
  resolveRowColors,
}: {
  rows: CalendarInstitutionApplicationListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  resolveRowColors?: (row: CalendarInstitutionApplicationListRow) => ScheduleColorPair | undefined
}) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <div
      className={
        rows.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'
      }
    >
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        rows.map(row => {
          const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={row.id}
              className={[
                'calendar-list-item',
                selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="calendar-list-item__column">
                <CalendarListItemContentInstitutionApplication
                  row={row}
                  checked={selectedSet.has(row.id)}
                  onToggle={handleToggle}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function CalendarSubRightList(props: CalendarSubRightListProps) {
  if (isInstitutionApplicationListProps(props)) {
    return (
      <CalendarSubRightInstitutionApplicationList
        rows={props.rows}
        selectedRowKeys={props.selectedRowKeys}
        onSelectionChange={props.onSelectionChange}
        resolveRowColors={props.resolveRowColors}
      />
    )
  }

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

export type CalendarSubRightGeneralInstitutionApplicationListProps = {
  rows: CalendarGeneralInstitutionApplicationListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onRowClick: (row: CalendarGeneralInstitutionApplicationListRow) => void
  resolveRowColors?: (
    row: CalendarGeneralInstitutionApplicationListRow
  ) => ScheduleColorPair | undefined
  toolbar?: ReactNode
}

function CalendarListShell({
  toolbar,
  isEmpty,
  children,
}: {
  toolbar?: ReactNode
  isEmpty: boolean
  children: ReactNode
}) {
  if (!toolbar) {
    return (
      <div className={isEmpty ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
        {isEmpty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
        ) : (
          children
        )}
      </div>
    )
  }

  return (
    <div className="calendar-list calendar-list--with-toolbar">
      <div className="calendar-list__toolbar">{toolbar}</div>
      <div
        className={[
          'calendar-list__items',
          isEmpty ? 'calendar-list__items--empty' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isEmpty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function CalendarSubRightGeneralInstitutionApplicationList({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
  toolbar,
}: CalendarSubRightGeneralInstitutionApplicationListProps) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <CalendarListShell toolbar={toolbar} isEmpty={rows.length === 0}>
      {rows.map(row => {
        const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
        return (
          <div
            key={row.id}
            className={[
              'calendar-list-item',
              selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-has-color="true"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
            onClick={() => onRowClick(row)}
          >
            <div className="calendar-list-item__column">
              <CalendarListItemContentGeneralInstitutionApplication
                row={row}
                checked={selectedSet.has(row.id)}
                onToggle={handleToggle}
              />
            </div>
          </div>
        )
      })}
    </CalendarListShell>
  )
}

export type CalendarSubRightGeneralInstructorApplicationListProps = {
  rows: CalendarGeneralInstructorApplicationListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onRowClick: (row: CalendarGeneralInstructorApplicationListRow) => void
  resolveRowColors?: (
    row: CalendarGeneralInstructorApplicationListRow
  ) => ScheduleColorPair | undefined
  toolbar?: ReactNode
}

export function CalendarSubRightGeneralInstructorApplicationList({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
  toolbar,
}: CalendarSubRightGeneralInstructorApplicationListProps) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <CalendarListShell toolbar={toolbar} isEmpty={rows.length === 0}>
      {rows.map(row => {
        const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
        return (
          <div
            key={row.id}
            className={[
              'calendar-list-item',
              selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-has-color="true"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
            onClick={() => onRowClick(row)}
          >
            <div className="calendar-list-item__column">
              <CalendarListItemContentGeneralInstructorApplication
                row={row}
                checked={selectedSet.has(row.id)}
                onToggle={handleToggle}
              />
            </div>
          </div>
        )
      })}
    </CalendarListShell>
  )
}

export type CalendarSubRightGeneralIndividualApplicationListProps = {
  rows: CalendarGeneralIndividualApplicationListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onRowClick: (row: CalendarGeneralIndividualApplicationListRow) => void
  resolveRowColors?: (
    row: CalendarGeneralIndividualApplicationListRow
  ) => ScheduleColorPair | undefined
  toolbar?: ReactNode
}

export function CalendarSubRightGeneralIndividualApplicationList({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
  toolbar,
}: CalendarSubRightGeneralIndividualApplicationListProps) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <CalendarListShell toolbar={toolbar} isEmpty={rows.length === 0}>
      {rows.map(row => {
        const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
        return (
          <div
            key={row.id}
            className={[
              'calendar-list-item',
              selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-has-color="true"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
            onClick={() => onRowClick(row)}
          >
            <div className="calendar-list-item__column">
              <CalendarListItemContentGeneralIndividualApplication
                row={row}
                checked={selectedSet.has(row.id)}
                onToggle={handleToggle}
              />
            </div>
          </div>
        )
      })}
    </CalendarListShell>
  )
}

export type CalendarGeneralProgramEventListRow = {
  id: string | number
  programId: string
  programTitle: string
  scheduleContent: string
  timeLabel: string
  startDate: string
  endDate: string
  originalItem: Program
}

export type CalendarSubRightGeneralProgramEventListProps = {
  selectedDate: Dayjs
  events: CalendarGeneralProgramEventListRow[]
  onEventClick: (program: Program) => void
  resolveEventColors?: (event: CalendarGeneralProgramEventListRow) => ScheduleColorPair | undefined
}

export function CalendarSubRightGeneralProgramEventList({
  selectedDate,
  events,
  onEventClick,
  resolveEventColors,
}: CalendarSubRightGeneralProgramEventListProps) {
  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')
    })
  }, [events, selectedDate])

  return (
    <div className={dayEvents.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {dayEvents.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        dayEvents.map(event => {
          const colors = resolveEventColors?.(event) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={String(event.id)}
              className="calendar-list-item"
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onEventClick(event.originalItem)}
            >
              <div className="calendar-list-item__column">
                <CalendarListItemContentGeneralProgramEvent
                  programTitle={event.programTitle}
                  scheduleContent={event.scheduleContent}
                  timeLabel={event.timeLabel}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
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

export type CalendarSubRightVolunteerInterviewListProps = {
  rows: CalendarVolunteerInterviewListRow[]
  onRowClick: (row: CalendarVolunteerInterviewListRow) => void
  resolveRowColors?: (row: CalendarVolunteerInterviewListRow) => ScheduleColorPair | undefined
}

export function CalendarSubRightVolunteerInterviewList({
  rows,
  onRowClick,
  resolveRowColors,
}: CalendarSubRightVolunteerInterviewListProps) {
  return (
    <div className={rows.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        rows.map(row => {
          const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={row.id}
              className="calendar-list-item"
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onRowClick(row)}
            >
              <div className="calendar-list-item__column">
                <CalendarListItemContentVolunteerInterview row={row} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export type CalendarSubRightVolunteerInterview2ListProps = {
  rows: CalendarVolunteerInterview2ListRow[]
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onRowClick: (row: CalendarVolunteerInterview2ListRow) => void
  resolveRowColors?: (row: CalendarVolunteerInterview2ListRow) => ScheduleColorPair | undefined
}

export function CalendarSubRightVolunteerInterview2List({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resolveRowColors,
}: CalendarSubRightVolunteerInterview2ListProps) {
  const selectedSet = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys])

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(key)) return
        onSelectionChange([...selectedRowKeys, key])
      } else {
        onSelectionChange(selectedRowKeys.filter(k => String(k) !== key))
      }
    },
    [onSelectionChange, selectedRowKeys, selectedSet]
  )

  return (
    <div className={rows.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        rows.map(row => {
          const colors = resolveRowColors?.(row) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={row.id}
              className={[
                'calendar-list-item',
                selectedSet.has(row.id) ? 'calendar-list-item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onRowClick(row)}
            >
              <div className="calendar-list-item__column">
                <CalendarListItemContentVolunteerInterview2
                  row={row}
                  checked={selectedSet.has(row.id)}
                  onToggle={handleToggle}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
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
    <div
      className={
        dayRows.length === 0
          ? 'calendar-list settlement-list-item-list calendar-list--empty'
          : 'calendar-list settlement-list-item-list'
      }
    >
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
