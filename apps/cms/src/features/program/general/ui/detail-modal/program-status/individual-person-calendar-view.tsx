/**
 * 개인형 진행 현황 캘린더 뷰 — 참여자·참여 봉사자 공통 (풀페이지 모달 > 프로그램 진행 현황)
 *
 * - 사람 1명 × 일정 1건 = 캘린더 이벤트 1개, 색은 이름 가나다순 기준
 * - 우측: 선택일 일정 목록(이름 · 메타 · 시간 + 체크박스). 기관 검색/필터 없음
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  buildIndividualPersonCalendarEvents,
  type IndividualPersonCalendarEvent,
} from '@/features/program/general/lib/build-individual-person-calendar-events'
import { formatInstitutionCalendarSessionTimeDisplay } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-calendar-session'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  calendarItemsForEventMode,
  type CalendarItem,
} from '@/shared/components/calendar'
import {
  createInitialCalendarNavigationState,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import { calendarListItemBackground } from '@/shared/components/calendar/lib/calendar-list-item-background'
import { EmptyState } from '@/shared/ui'
import { ParticipatingParticipantCalendarListItem } from './participating-participant-calendar-list-item'
import '@/shared/components/calendar/styles/calendar.css'
import './participating-institutions-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type IndividualPersonCalendarAccessors<T> = {
  getId: (person: T) => string
  /** 이벤트 제목·목록 이름·색 기준 (빈 값이면 fallbackName) */
  getName: (person: T) => string
  getSessions: (person: T) => readonly ParticipatingSchoolSession[] | null | undefined
  /** 이름 아래 메타 라벨 (디바이더로 구분) */
  getMetaLabels: (person: T) => readonly string[]
}

function IndividualPersonCalendarPopoverContent<T>({
  events,
  getMetaLabels,
}: {
  events: IndividualPersonCalendarEvent<T>[]
  getMetaLabels: (person: T) => readonly string[]
}) {
  return (
    <div className="calendar-preview-popover">
      {events.map(ev => {
        const { person, personName, session } = ev.originalItem
        const sessionLine = formatInstitutionCalendarSessionTimeDisplay(session)
        const metaLabels = getMetaLabels(person)

        return (
          <div key={ev.id} className="calendar-preview-popover__entry">
            <div className="calendar-preview-popover__title">{personName}</div>
            <div className="calendar-preview-popover__meta">
              {metaLabels.map((label, index) => (
                <Fragment key={`${label}-${index}`}>
                  {index > 0 ? (
                    <span className="calendar-preview-popover__meta-sep" aria-hidden />
                  ) : null}
                  <span className="calendar-preview-popover__meta-part">{label}</span>
                </Fragment>
              ))}
              {sessionLine !== '-' ? (
                <>
                  {metaLabels.length > 0 ? (
                    <span className="calendar-preview-popover__meta-sep" aria-hidden />
                  ) : null}
                  <span className="calendar-preview-popover__meta-part calendar-preview-popover__meta-part--session">
                    {sessionLine}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IndividualPersonCalendarRight<T>({
  events,
  getColorForName,
  getMetaLabels,
  selectedIds,
  onSelectionChange,
  onPersonClick,
}: {
  events: readonly IndividualPersonCalendarEvent<T>[]
  getColorForName: (name: string) => ScheduleColorPair
  getMetaLabels: (person: T) => readonly string[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onPersonClick: (person: T) => void
}) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        a.originalItem.personName.localeCompare(b.originalItem.personName, 'ko')
      ),
    [events]
  )

  const handleToggle = useCallback(
    (personId: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(personId)) return
        onSelectionChange([...selectedIds, personId])
      } else {
        onSelectionChange(selectedIds.filter(id => id !== personId))
      }
    },
    [onSelectionChange, selectedIds, selectedSet]
  )

  const isEmpty = sortedEvents.length === 0

  return (
    <div
      className={
        isEmpty
          ? 'calendar-list participating-participants-calendar-right calendar-list--empty'
          : 'calendar-list participating-participants-calendar-right'
      }
    >
      {isEmpty ? (
        <EmptyState description="해당 날짜에 일정이 없습니다" />
      ) : (
        sortedEvents.map(event => {
          const { person, personId, personName, session } = event.originalItem
          const colors = getColorForName(personName) ?? SCHEDULE_COLORS[0]
          const checked = selectedSet.has(personId)

          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              className={['calendar-list-item', checked ? 'calendar-list-item--selected' : '']
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: calendarListItemBackground(colors.bg),
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => onPersonClick(person)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPersonClick(person)
                }
              }}
            >
              <div className="calendar-list-item__column">
                <ParticipatingParticipantCalendarListItem
                  row={{
                    id: event.id,
                    participantId: personId,
                    participantName: personName,
                    metaLabels: getMetaLabels(person),
                    sessionLabel: formatInstitutionCalendarSessionTimeDisplay(session),
                  }}
                  checked={checked}
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

export interface IndividualPersonCalendarViewProps<T> {
  people: readonly T[]
  accessors: IndividualPersonCalendarAccessors<T>
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
  onPersonClick: (person: T) => void
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
}

export function IndividualPersonCalendarView<T>({
  people,
  accessors,
  selectedRowKeys,
  onSelectionChange,
  onPersonClick,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
}: IndividualPersonCalendarViewProps<T>) {
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
  const didSnapToEventsRef = useRef(false)

  const { getId, getName, getSessions, getMetaLabels } = accessors

  const events = useMemo(
    () => buildIndividualPersonCalendarEvents(people, { getId, getName, getSessions }),
    [people, getId, getName, getSessions]
  )

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

  const nameToColorIndex = useMemo(() => {
    const names = Array.from(new Set(people.map(p => getName(p).trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, 'ko')
    )
    const map = new Map<string, number>()
    names.forEach((name, i) => map.set(name, i % SCHEDULE_COLORS.length))
    return map
  }, [people, getName])

  const getColorForName = useCallback(
    (name: string) => {
      const idx = nameToColorIndex.get(name.trim()) ?? 0
      return SCHEDULE_COLORS[idx % SCHEDULE_COLORS.length]
    },
    [nameToColorIndex]
  )

  /** 캘린더 태그 색 = 우측 목록 색과 동일 기준(이름 가나다순) */
  const overrideEventColorMap = useCallback(
    (items: CalendarItem[]) => {
      const map = new Map<string | number, ScheduleColorPair>()
      for (const item of calendarItemsForEventMode(items)) {
        const event = item.original as IndividualPersonCalendarEvent<T> | undefined
        map.set(item.id, getColorForName(event?.originalItem?.personName ?? ''))
      }
      return map
    },
    [getColorForName]
  )

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter(
        ev =>
          selectedDate.isSameOrAfter(dayjs(ev.startDate), 'day') &&
          selectedDate.isSameOrBefore(dayjs(ev.endDate), 'day')
      ),
    [events, selectedDate]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  return (
    <CalendarSplitCardLayout
      pageScroll
      left={
        <CalendarMain
          className="calendar-split-card-main"
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
          overrideEventColorMap={overrideEventColorMap}
          previewTooltipContent={({ events: dayItems }) => (
            <IndividualPersonCalendarPopoverContent
              events={calendarItemsForEventMode(dayItems).map(
                item => item.original as IndividualPersonCalendarEvent<T>
              )}
              getMetaLabels={getMetaLabels}
            />
          )}
        />
      }
      right={
        <IndividualPersonCalendarRight
          events={eventsForSelectedDate}
          getColorForName={getColorForName}
          getMetaLabels={getMetaLabels}
          selectedIds={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onPersonClick={onPersonClick}
        />
      }
    />
  )
}
