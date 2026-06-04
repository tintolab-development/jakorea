import { useState, useMemo, useCallback, useEffect, useRef, type Key } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ApplicantScheduleList } from './applicant-schedule-list'
import { GeneralInstructorCalendarScheduleList } from './applicant-general-instructor-calendar-schedule-list'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import './applicant-calendar-view.css'
import { CalendarMain } from '@/shared/components/calendar'
import {
  createInitialCalendarNavigationState,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import { CmsSelect, CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui'
import '@/shared/components/calendar/styles/calendar.css'
import { useApplicantCalendarColorMaps } from './applicant-calendar-schedule-helpers'
import { renderGeneralInstructorCalendarMonthEventContent } from './applicant-instructor-calendar-month-event'
import { renderProgramCalendarEventsDefaultTooltipContent } from '@/shared/components/calendar/ui/preview-tooltip/program'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import type { ApplicantListMenu } from './applicant-list-menu'
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type ApplicantCalendarFilterEntity = 'school' | 'participant'

interface ApplicantCalendarViewProps {
  events: ApplicantCalendarEvent[]
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onItemClick: (item: ApplicantCalendarEvent['originalItem']) => void
  /** 월간/주간 — onCalendarGranularityChange와 함께 전달 시 쿼리스트링 등과 동기화 */
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
  /** 일반 프로그램 강사 신청 캘린더 — strip·툴팁·우측 카드 스펙 */
  calendarVariant?: 'default' | 'general-instructor'
  /** 우측 다중 선택 필터 기준 (기관명 vs 참여자명) */
  filterEntity?: ApplicantCalendarFilterEntity
  /** LNB 메뉴 — filterEntity 미지정 시 자동 추론 */
  menu?: ApplicantListMenu | ''
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
}: ApplicantCalendarViewProps) {
  const isGeneralInstructor = calendarVariant === 'general-instructor'
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
  /** 날짜별 필터 옵션과 동기화 시 전체 선택이 기본, []는 사용자가 모두 해제한 경우 */
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const didSnapToEventsRef = useRef(false)

  /** mock·실데이터 일정이 현재 월 밖이면 빈 캘린더로 보이지 않도록 최초 1회 앵커 이동 */
  useEffect(() => {
    if (didSnapToEventsRef.current || events.length === 0) return
    const startDates = events
      .map(ev => dayjs(ev.startDate))
      .filter(d => d.isValid())
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

  const getEventsForDate = (date: Dayjs): ApplicantCalendarEvent[] => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
    })
  }

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [events, selectedDate])
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
  const getColorForScheduleList = useCallback(
    (event: any) => scheduleListColorMap.get(event.id) ?? SCHEDULE_COLORS[0],
    [scheduleListColorMap]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  if (loading) {
    return (
      <div className="applicant-calendar-view applicant-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  const calendarMain = (
    <CalendarMain
      className="applicant-calendar-main"
      events={events}
      selectedRowKeys={selectedRowKeys}
      selectedDate={selectedDate}
      currentMonth={currentMonth}
      mode={calendarMode}
      onSelectDate={handleDateSelect}
      onMonthChange={setCurrentMonth}
      onModeChange={setCalendarMode}
      {...(isGeneralInstructor
        ? {
            eventsTooltipScope: 'full-day' as const,
            eventsTooltipTrigger: 'cell' as const,
            formatEventsOverflowText: (n: number) => `외 ${n}개의 항목`,
            previewTooltipContent: renderProgramCalendarEventsDefaultTooltipContent,
            renderMonthEventContent: renderGeneralInstructorCalendarMonthEventContent,
          }
        : {})}
    />
  )

  const scheduleList = isGeneralInstructor ? (
    <GeneralInstructorCalendarScheduleList
      events={filteredDayEvents}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onInstructorClick={onItemClick}
    />
  ) : (
    <ApplicantScheduleList
      selectedDate={selectedDate}
      events={filteredDayEvents}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onEventClick={onItemClick}
      getColorForEvent={getColorForScheduleList}
    />
  )

  return (
    <div
      className={[
        'calendar-set',
        'applicant-calendar-set',
        isGeneralInstructor
          ? 'applicant-calendar-set--general-instructor'
          : 'applicant-calendar-set--default',
      ].join(' ')}
    >
      <div className="calendar-main-container">{calendarMain}</div>
      <div className="calendar-sub-right-list applicant-calendar-sub-right-list">
        <div className="applicant-calendar-sub-right-list__school-filter">
          <CmsSelect
            mode="multiple"
            withAllOption={false}
            value={selectedSchools}
            onChange={next => setSelectedSchools(next as string[])}
            options={entityFilterOptions}
            placeholder={filterEntity === 'participant' ? '참여자 선택' : '기관 선택'}
          />
        </div>
        {scheduleList}
      </div>
    </div>
  )
}
