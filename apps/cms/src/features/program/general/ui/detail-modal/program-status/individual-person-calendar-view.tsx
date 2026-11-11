/**
 * 개인형 진행 현황 캘린더 뷰 — 참여자·참여 봉사자 공통 (풀페이지 모달 > 프로그램 진행 현황)
 *
 * - 사람 1명 × 일정 1건 = 캘린더 이벤트 1개, 색은 이름 가나다순 기준
 * - 우측: 선택일 일정 목록(이름 · 메타 · 시간 + 체크박스). 기관 검색/필터 없음
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import type { RenderCalendarMonthEventContent } from '@/shared/components/calendar/model/calendar-month-cell-row'
import { EmptyState } from '@/shared/ui'
import { ParticipatingParticipantCalendarListItem } from './participating-participant-calendar-list-item'
import type { Program } from '@/types/domain'
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
  /**
   * 월간 셀 「이름 | X」 오른쪽 조각. 생략하면 이름만(기존 참여자·참여 봉사자 동작).
   * 예: 개인형 강사 신청 「김도영 | 대구광역시」, 참여 강사 「김제이 | 2차시 (09:20 ~ 11:20)」
   */
  getCellRightLabel?: (event: IndividualPersonCalendarEvent<T>) => string | undefined
  /** 팝오버 이름 아래 줄. 생략하면 `getMetaLabels` + 차시(시간) */
  getPopoverMetaLabels?: (event: IndividualPersonCalendarEvent<T>) => readonly string[]
}

/**
 * 일정이 하나도 없는 사람의 우측 카드 렌더. 넘기면 선택일과 무관하게 날짜 카드 아래에 항상 노출한다
 * (날짜 셀에는 그리지 않음). 생략하면 일정 없는 사람은 캘린더에 나오지 않는다(기존 동작).
 */
export type IndividualPersonCalendarUnscheduledListItemRenderer<T> = (args: {
  person: T
  personId: string
  personName: string
  checked: boolean
  onToggle: (personId: string, checked: boolean) => void
}) => ReactNode

/** 우측 목록 카드 커스텀 렌더 — 생략하면 참여자 카드(이름 · 메타 · 시간) */
export type IndividualPersonCalendarListItemRenderer<T> = (args: {
  event: IndividualPersonCalendarEvent<T>
  checked: boolean
  onToggle: (personId: string, checked: boolean) => void
}) => ReactNode

function IndividualPersonCalendarPopoverContent<T>({
  events,
  getMetaLabels,
  getPopoverMetaLabels,
  program,
}: {
  events: IndividualPersonCalendarEvent<T>[]
  getMetaLabels: (person: T) => readonly string[]
  getPopoverMetaLabels?: (event: IndividualPersonCalendarEvent<T>) => readonly string[]
  program?: Program | null
}) {
  return (
    <div className="calendar-preview-popover">
      {events.map(ev => {
        const { person, personName, session } = ev.originalItem
        // 커스텀 줄이 있으면 그 줄만 쓴다(차시를 자동으로 덧붙이지 않음)
        const sessionLine = getPopoverMetaLabels
          ? '-'
          : formatInstitutionCalendarSessionTimeDisplay(session, undefined, program)
        const metaLabels = getPopoverMetaLabels ? getPopoverMetaLabels(ev) : getMetaLabels(person)

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
  renderListItem,
  emptyDescription,
  program,
  unscheduledPeople,
  renderUnscheduledListItem,
  getId,
  getName,
}: {
  events: readonly IndividualPersonCalendarEvent<T>[]
  getColorForName: (name: string) => ScheduleColorPair
  getMetaLabels: (person: T) => readonly string[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onPersonClick: (person: T) => void
  renderListItem?: IndividualPersonCalendarListItemRenderer<T>
  emptyDescription?: string
  program?: Program | null
  unscheduledPeople: readonly T[]
  renderUnscheduledListItem?: IndividualPersonCalendarUnscheduledListItemRenderer<T>
  getId: (person: T) => string
  getName: (person: T) => string
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

  const unscheduledItems = renderUnscheduledListItem ? unscheduledPeople : []
  const isEmpty = sortedEvents.length === 0 && unscheduledItems.length === 0

  return (
    <div
      className={
        isEmpty
          ? 'calendar-list participating-participants-calendar-right calendar-list--empty'
          : 'calendar-list participating-participants-calendar-right'
      }
    >
      {isEmpty ? (
        <EmptyState description={emptyDescription ?? '해당 날짜에 일정이 없습니다'} />
      ) : null}
      {isEmpty
        ? null
        : sortedEvents.map(event => {
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
                {renderListItem ? (
                  renderListItem({ event, checked, onToggle: handleToggle })
                ) : (
                  <ParticipatingParticipantCalendarListItem
                    row={{
                      id: event.id,
                      participantId: personId,
                      participantName: personName,
                      metaLabels: getMetaLabels(person),
                      sessionLabel: formatInstitutionCalendarSessionTimeDisplay(
                        session,
                        undefined,
                        program
                      ),
                    }}
                    checked={checked}
                    onToggle={handleToggle}
                  />
                )}
              </div>
            </div>
          )
        })}
      {renderUnscheduledListItem
        ? unscheduledItems.map(person => {
            const personId = getId(person)
            const personName = getName(person)
            const colors = getColorForName(personName) ?? SCHEDULE_COLORS[0]
            const checked = selectedSet.has(personId)
            return (
              <div
                key={`unscheduled-${personId}`}
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
                  {renderUnscheduledListItem({
                    person,
                    personId,
                    personName,
                    checked,
                    onToggle: handleToggle,
                  })}
                </div>
              </div>
            )
          })
        : null}
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
  /** 우측 카드 커스텀 렌더(개인형 강사 신청·참여 강사). 생략 시 참여자 카드 */
  renderListItem?: IndividualPersonCalendarListItemRenderer<T>
  /** 캘린더 전체 이벤트가 0건일 때 우측 빈 안내 문구. 생략 시 「해당 날짜에 일정이 없습니다」 */
  emptyDescription?: string
  /** 일정·목록 조회 중 — `CalendarSplitCardLayout` 로딩 */
  loading?: boolean
  /**
   * 기본 팝오버·참여자 카드 일정 라벨 — 일반 프로그램이면 교육 구조별
   * (일정형=세부 일정명, 단일 회차=N차시, 복수 회차=N회차). 생략 시 시간(·신청 차시 수)만
   */
  program?: Program | null
  /** 일정 없는 사람 우측 카드(선택일 무관, 날짜 카드 아래). 생략 시 기존처럼 미노출 */
  renderUnscheduledListItem?: IndividualPersonCalendarUnscheduledListItemRenderer<T>
}

export function IndividualPersonCalendarView<T>({
  people,
  accessors,
  selectedRowKeys,
  onSelectionChange,
  onPersonClick,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
  renderListItem,
  emptyDescription,
  loading,
  program,
  renderUnscheduledListItem,
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

  const { getId, getName, getSessions, getMetaLabels, getCellRightLabel, getPopoverMetaLabels } =
    accessors

  const events = useMemo(
    () => buildIndividualPersonCalendarEvents(people, { getId, getName, getSessions }),
    [people, getId, getName, getSessions]
  )

  /** 날짜에 그릴 일정이 하나도 없는 사람 — `renderUnscheduledListItem`이 있을 때만 우측에 노출 */
  const unscheduledPeople = useMemo(() => {
    if (!renderUnscheduledListItem) return []
    const scheduledIds = new Set(events.map(event => event.originalItem.personId))
    return [...people]
      .filter(person => !scheduledIds.has(getId(person)))
      .sort((a, b) => getName(a).localeCompare(getName(b), 'ko'))
  }, [events, getId, getName, people, renderUnscheduledListItem])

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

  /** 월간 셀 「이름 | X」 — `getCellRightLabel`이 있을 때만 커스텀 렌더 */
  const renderMonthEventContent = useMemo((): RenderCalendarMonthEventContent | undefined => {
    if (!getCellRightLabel) return undefined
    return ({ row, colors }) => {
      const event = row.sourceEvent.original as IndividualPersonCalendarEvent<T> | undefined
      const left = event?.originalItem.personName ?? String(row.sourceEvent.title ?? '')
      const right = event ? getCellRightLabel(event)?.trim() : undefined
      return (
        <CalendarMonthEventTitleWithDivider
          parts={right && right !== '-' ? { left, right } : { left }}
          accentColor={colors.text}
        />
      )
    }
  }, [getCellRightLabel])

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  return (
    <CalendarSplitCardLayout
      pageScroll
      loading={loading}
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
          renderMonthEventContent={renderMonthEventContent}
          previewTooltipContent={({ events: dayItems }) => (
            <IndividualPersonCalendarPopoverContent
              events={calendarItemsForEventMode(dayItems).map(
                item => item.original as IndividualPersonCalendarEvent<T>
              )}
              getMetaLabels={getMetaLabels}
              getPopoverMetaLabels={getPopoverMetaLabels}
              program={program}
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
          renderListItem={renderListItem}
          emptyDescription={events.length === 0 ? emptyDescription : undefined}
          program={program}
          unscheduledPeople={unscheduledPeople}
          renderUnscheduledListItem={renderUnscheduledListItem}
          getId={getId}
          getName={getName}
        />
      }
    />
  )
}
