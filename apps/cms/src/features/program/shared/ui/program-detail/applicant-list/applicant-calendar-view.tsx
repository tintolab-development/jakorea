import { useState, useMemo, useCallback, useEffect, useRef, type Key } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { ApplicantScheduleList } from './applicant-schedule-list'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import './applicant-calendar-view.css'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  CalendarSubRightGeneralInstitutionApplicationList,
  CalendarSubRightGeneralInstructorApplicationList,
  type CalendarGeneralInstitutionApplicationListRow,
  type CalendarGeneralInstructorApplicationListRow,
} from '@/shared/components/calendar'
import {
  createInitialCalendarNavigationState,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import { CmsSelect, CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui'
import '@/shared/components/calendar/styles/calendar.css'
import { useApplicantCalendarColorMaps } from './applicant-calendar-schedule-helpers'
import { renderGeneralInstructorCalendarMonthEventContent } from './applicant-instructor-calendar-month-event'
import { renderGeneralInstitutionCalendarPreviewTooltipContent } from './applicant-general-institution-calendar-popover'
import { renderGeneralInstructorCalendarPreviewTooltipContent } from './applicant-general-instructor-calendar-popover'
import { renderProgramCalendarEventsDefaultTooltipContent } from '@/shared/components/calendar/ui/preview-tooltip/program'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import type { ApplicantListMenu } from './applicant-list-menu'
import {
  buildGeneralInstitutionCalendarListRows,
  buildGeneralInstructorCalendarListRows,
  filterApplicantCalendarEventsForDate,
} from './applicant-general-calendar-list-rows'
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type ApplicantCalendarFilterEntity = 'school' | 'participant'

interface ApplicantCalendarViewProps {
  events: ApplicantCalendarEvent[]
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onItemClick: (item: ApplicantCalendarEvent['originalItem']) => void
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
  calendarVariant?: 'default' | 'general-instructor' | 'general-institution'
  filterEntity?: ApplicantCalendarFilterEntity
  menu?: ApplicantListMenu | ''
  /** 일반 프로그램 상세 풀페이지 모달 — split-card + page-scroll sticky */
  useSplitCardPageScroll?: boolean
}

function findInstitutionForRow(
  events: ApplicantCalendarEvent[],
  row: CalendarGeneralInstitutionApplicationListRow
): ApplicantSchoolRow | null {
  for (const event of events) {
    const institution = event.originalItem as ApplicantSchoolRow | undefined
    if (!institution) continue
    const key =
      typeof institution.id === 'string' && institution.id ? institution.id : String(event.id)
    if (key === row.id) return institution
  }
  return null
}

function findInstructorForRow(
  events: ApplicantCalendarEvent[],
  row: CalendarGeneralInstructorApplicationListRow
): ApplicantInstructorRow | null {
  for (const event of events) {
    const originalItem = event.originalItem as unknown as Record<string, unknown> | undefined
    if (!originalItem) continue
    const institutionRows = originalItem.calendarInstitutionInstructors as
      | ApplicantInstructorRow[]
      | undefined
    if (institutionRows?.length) {
      const match = institutionRows.find(inst => String(inst.id) === row.id)
      if (match) return match
      continue
    }
    if (typeof originalItem.instructorName === 'string' && String(event.id) === row.id) {
      return originalItem as unknown as ApplicantInstructorRow
    }
  }
  return null
}

export function ApplicantCalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
  calendarVariant = 'default',
  filterEntity: filterEntityProp,
  menu = '',
  useSplitCardPageScroll = false,
}: ApplicantCalendarViewProps) {
  const isGeneralInstructor = calendarVariant === 'general-instructor'
  const isGeneralInstitution = calendarVariant === 'general-institution'
  const usesSplitCardLayout = useSplitCardPageScroll || isGeneralInstructor || isGeneralInstitution
  const filterEntity: ApplicantCalendarFilterEntity =
    filterEntityProp ?? (menu === 'individual-applications' ? 'participant' : 'school')
  const [fallbackCalendarMode, setFallbackCalendarMode] = useState<'month' | 'week'>('month')
  const calendarControlled =
    calendarGranularityProp !== undefined && onCalendarGranularityChange !== undefined
  const calendarMode = calendarControlled ? calendarGranularityProp : fallbackCalendarMode
  const setCalendarMode = (mode: 'month' | 'week') => {
    if (calendarControlled) onCalendarGranularityChange(mode)
    else setFallbackCalendarMode(mode)
  }
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    createInitialCalendarNavigationState(calendarGranularityProp ?? 'month').viewAnchor
  )
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const didSnapToEventsRef = useRef(false)

  useEffect(() => {
    if (didSnapToEventsRef.current || events.length === 0) return
    const startDates = events.map(ev => dayjs(ev.startDate)).filter(d => d.isValid())
    if (startDates.length === 0) return
    const earliest = startDates.reduce((a, b) => (a.isBefore(b) ? a : b))
    const hasEventsInViewMonth = events.some(ev =>
      dayjs(ev.startDate).isSame(currentMonth, 'month')
    )
    if (!hasEventsInViewMonth) {
      setCurrentMonth(earliest.startOf('month'))
      setSelectedDate(earliest.startOf('day'))
    }
    didSnapToEventsRef.current = true
  }, [events, currentMonth])

  const resolveFilterLabel = useCallback(
    (ev: ApplicantCalendarEvent): string => {
      const item = ev.originalItem
      if (!item || typeof item !== 'object') return ''
      if (filterEntity === 'participant' && 'applicantName' in item) {
        return String(item.applicantName ?? '').trim()
      }
      if ('schoolName' in item) {
        return String(item.schoolName ?? '').trim()
      }
      if ('applicantName' in item) {
        return String(item.applicantName ?? '').trim()
      }
      return ''
    },
    [filterEntity]
  )

  const dayEvents = useMemo(
    () => filterApplicantCalendarEventsForDate(events, selectedDate),
    [events, selectedDate]
  )

  const entityFilterOptions = useMemo(() => {
    const uniqueLabels = Array.from(
      new Set(dayEvents.map(ev => resolveFilterLabel(ev)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    return uniqueLabels.map((label, i) => ({
      value: label,
      label,
      tagColor: CMS_MULTI_SELECT_TAG_COLORS[i % CMS_MULTI_SELECT_TAG_COLORS.length],
    }))
  }, [dayEvents, resolveFilterLabel])

  useEffect(() => {
    setSelectedSchools(entityFilterOptions.map(o => o.value))
  }, [entityFilterOptions])

  const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

  const filteredDayEvents = useMemo(() => {
    if (selectedSchools.length === 0) return []
    const selectedSet = new Set(selectedSchools)
    return dayEvents.filter(ev => {
      const label = resolveFilterLabel(ev)
      return label !== '' && selectedSet.has(label)
    })
  }, [dayEvents, selectedSchools, resolveFilterLabel])

  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )

  const resolveGeneralRowColors = useCallback(
    (row: { colorKey: string | number }) =>
      scheduleListColorMap.get(row.colorKey) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const getColorForScheduleList = useCallback(
    (event: ApplicantCalendarEvent) => scheduleListColorMap.get(event.id) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const institutionListRows = useMemo(
    () => (isGeneralInstitution ? buildGeneralInstitutionCalendarListRows(filteredDayEvents) : []),
    [filteredDayEvents, isGeneralInstitution]
  )

  const instructorListRows = useMemo(
    () => (isGeneralInstructor ? buildGeneralInstructorCalendarListRows(filteredDayEvents) : []),
    [filteredDayEvents, isGeneralInstructor]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  const handleInstitutionRowClick = useCallback(
    (row: CalendarGeneralInstitutionApplicationListRow) => {
      const institution = findInstitutionForRow(filteredDayEvents, row)
      if (institution) onItemClick(institution)
    },
    [filteredDayEvents, onItemClick]
  )

  const handleInstructorRowClick = useCallback(
    (row: CalendarGeneralInstructorApplicationListRow) => {
      const instructor = findInstructorForRow(filteredDayEvents, row)
      if (instructor) onItemClick(instructor)
    },
    [filteredDayEvents, onItemClick]
  )

  const entityFilterSelect = (
    <CmsSelect
      mode="multiple"
      withAllOption={false}
      width="100%"
      value={selectedSchools}
      onChange={next => setSelectedSchools(next as string[])}
      options={entityFilterOptions}
      placeholder={filterEntity === 'participant' ? '참여자 선택' : '기관 선택'}
    />
  )

  const rightListContent = isGeneralInstitution ? (
    <CalendarSubRightGeneralInstitutionApplicationList
      rows={institutionListRows}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onRowClick={handleInstitutionRowClick}
      resolveRowColors={resolveGeneralRowColors}
      toolbar={entityFilterSelect}
    />
  ) : isGeneralInstructor ? (
    <CalendarSubRightGeneralInstructorApplicationList
      rows={instructorListRows}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onRowClick={handleInstructorRowClick}
      resolveRowColors={resolveGeneralRowColors}
      toolbar={entityFilterSelect}
    />
  ) : (
    <ApplicantScheduleList
      selectedDate={selectedDate}
      events={filteredDayEvents}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onEventClick={onItemClick}
      getColorForEvent={getColorForScheduleList}
      toolbar={entityFilterSelect}
    />
  )

  const calendarMain = (
    <CalendarMain
      className={usesSplitCardLayout ? 'calendar-split-card-main' : undefined}
      events={events}
      selectedRowKeys={selectedRowKeys}
      selectedDate={selectedDate}
      currentMonth={currentMonth}
      mode={calendarMode}
      onSelectDate={handleDateSelect}
      onMonthChange={setCurrentMonth}
      onModeChange={setCalendarMode}
      eventsTooltipScope="full-day"
      eventsTooltipTrigger="cell"
      formatEventsOverflowText={n => `외 ${n}개의 항목`}
      previewTooltipContent={
        isGeneralInstitution
          ? renderGeneralInstitutionCalendarPreviewTooltipContent
          : isGeneralInstructor
            ? renderGeneralInstructorCalendarPreviewTooltipContent
            : renderProgramCalendarEventsDefaultTooltipContent
      }
      {...(isGeneralInstructor
        ? { renderMonthEventContent: renderGeneralInstructorCalendarMonthEventContent }
        : {})}
    />
  )

  if (usesSplitCardLayout) {
    return (
      <CalendarSplitCardLayout
        pageScroll={useSplitCardPageScroll}
        loading={loading}
        left={calendarMain}
        right={rightListContent}
      />
    )
  }

  if (loading) {
    return (
      <div className="applicant-calendar-view applicant-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="calendar-set">
      <div className="calendar-main-container">{calendarMain}</div>
      <div className="calendar-sub-right-list">{rightListContent}</div>
    </div>
  )
}
