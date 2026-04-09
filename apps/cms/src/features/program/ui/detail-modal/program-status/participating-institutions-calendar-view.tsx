/**
 * 참여 기관 캘린더 뷰 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * 좌측 캘린더 7 : 우측 추등학교 리스트 3, 기존 Calendar·ApplicantScheduleList 활용
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { ApplicantScheduleList } from '../../../program-detail/ui/applicant-list/applicant-schedule-list'
import { SCHEDULE_COLORS } from '../../program-schedule-colors'
import { AppMultiSelect, ProgramCalendar, type ProgramCalendarEventItem } from '@/shared/ui'
import './participating-institutions-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** session.date "2026.01.09" → Dayjs */
function parseSessionDate(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 학교·날짜별 이벤트 (하루에 한 학교당 1건, 해당 날짜의 세션 목록 포함) */
interface CalendarEvent extends ProgramCalendarEventItem {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: {
    row: ParticipatingSchoolRow
    sessionsOnDate: ParticipatingSchoolSession[]
    educationGrade: string
    desiredEducationPeriod: string
  }
}

type CalendarPopoverRowParts = {
  title: string
  location: string
  valueLabel: string
  valueTone?: 'default' | 'pending' | 'partial' | 'completed' | 'na' | 'rejected'
}

function getPopoverRowParts(ev: CalendarEvent): CalendarPopoverRowParts {
  const row = ev.originalItem.row
  const settlementByApproval: Record<
    ParticipatingSchoolRow['approvalStatus'],
    { label: string; tone: CalendarPopoverRowParts['valueTone'] }
  > = {
    pending: { label: '정산 대기', tone: 'pending' },
    approved: { label: '정산 완료', tone: 'completed' },
    rejected: { label: '정산 반려', tone: 'rejected' },
    cancelled: { label: '해당 없음', tone: 'na' },
  }
  const settlement = settlementByApproval[row.approvalStatus] ?? {
    label: '정산 대기',
    tone: 'pending' as const,
  }
  return {
    title: row.schoolName || '-',
    location: row.region || '-',
    valueLabel: settlement.label,
    valueTone: settlement.tone,
  }
}

function ParticipatingCalendarEventPopoverContent({
  events,
  titleColorMap,
  resolvePopoverRowParts,
}: {
  events: CalendarEvent[]
  titleColorMap?: Map<string, string>
  resolvePopoverRowParts?: (ev: CalendarEvent) => CalendarPopoverRowParts
}) {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(ev => {
        const parts = resolvePopoverRowParts ? resolvePopoverRowParts(ev) : getPopoverRowParts(ev)
        const titleColor = titleColorMap?.get(String(ev.id))
        return (
          <div key={ev.id} className="participating-institutions-calendar-popover__row">
            <span
              className="participating-institutions-calendar-popover__title"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {parts.title}
            </span>
            <span className="participating-institutions-calendar-popover__sep" aria-hidden>
              |
            </span>
            <span className="participating-institutions-calendar-popover__text">
              {parts.location}
            </span>
            <span className="participating-institutions-calendar-popover__sep" aria-hidden>
              |
            </span>
            <span
              className={`participating-institutions-calendar-popover__text participating-institutions-calendar-popover__text--${parts.valueTone ?? 'default'}`}
            >
              {parts.valueLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function buildEventsFromSchools(schools: ParticipatingSchoolRow[]): CalendarEvent[] {
  const byDateAndSchool = new Map<
    string,
    { row: ParticipatingSchoolRow; sessions: ParticipatingSchoolSession[] }
  >()
  for (const row of schools) {
    const sessions = row.sessions ?? []
    for (const session of sessions) {
      const d = parseSessionDate(session.date)
      const key = `${d.format('YYYY-MM-DD')}_${row.id}`
      const existing = byDateAndSchool.get(key)
      if (existing) {
        existing.sessions.push(session)
      } else {
        byDateAndSchool.set(key, { row, sessions: [session] })
      }
    }
  }
  const events: CalendarEvent[] = []
  byDateAndSchool.forEach(({ row, sessions }) => {
    const d = parseSessionDate(sessions[0].date)
    const first = sessions[0]
    const timeRangeDisplay = first.timeRange.replace(/\s*~\s*/, ' ~ ')
    const periodLabel = first.classNum.endsWith('교시') ? first.classNum : `${first.classNum}교시`
    const periodStr = `${periodLabel} (${timeRangeDisplay})`
    events.push({
      id: row.id,
      title: `${row.schoolName} | ${row.region || '-'}`,
      startDate: d.format('YYYY-MM-DD'),
      endDate: d.format('YYYY-MM-DD'),
      originalItem: {
        row,
        sessionsOnDate: sessions,
        educationGrade: row.educationGrade,
        desiredEducationPeriod: periodStr,
      },
    })
  })
  return events
}

export interface ParticipatingInstitutionsCalendarViewProps {
  schools: ParticipatingSchoolRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onSchoolClick: (row: ParticipatingSchoolRow) => void
  /** 우측 카드 영역을 대체할 컨텐츠. 없으면 ApplicantScheduleList 사용 */
  rightContent?: React.ReactNode
  /** 날짜 셀 클릭 시 호출 (참여 강사 캘린더에서 우측 강사 목록 필터용) */
  onDateSelect?: (date: Dayjs) => void
  /** 월간/주간 — onCalendarGranularityChange와 함께 전달 시 쿼리스트링 등과 동기화 */
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
  /** 셀 hover 팝오버 한 줄 내용 커스터마이징 (탭별 대표 정보 유지) */
  resolvePopoverRowParts?: (args: { schoolRow: ParticipatingSchoolRow; date: Dayjs }) => {
    title: string
    location: string
    valueLabel: string
  }
}

export function ParticipatingInstitutionsCalendarView({
  schools,
  selectedRowKeys,
  onSelectionChange,
  onSchoolClick,
  rightContent,
  onDateSelect,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
  resolvePopoverRowParts,
}: ParticipatingInstitutionsCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  /** 기본 우측(참여 기관) 기관 멀티셀렉트 — 옵션 동기화 시 전체 선택 */
  const [defaultRightSelectedSchools, setDefaultRightSelectedSchools] = useState<string[]>([])
  const [fallbackCalendarMode, setFallbackCalendarMode] = useState<'month' | 'week'>('month')
  const calendarControlled =
    calendarGranularityProp !== undefined && onCalendarGranularityChange !== undefined
  const calendarMode = calendarControlled ? calendarGranularityProp : fallbackCalendarMode
  const setCalendarMode = (mode: 'month' | 'week') => {
    if (calendarControlled) onCalendarGranularityChange(mode)
    else setFallbackCalendarMode(mode)
  }
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const baseEvents = useMemo(() => buildEventsFromSchools(schools), [schools])
  const events = useMemo(
    () =>
      baseEvents.map(ev => {
        if (!resolvePopoverRowParts) return ev
        const parts = resolvePopoverRowParts({
          schoolRow: ev.originalItem.row,
          date: dayjs(ev.startDate),
        })
        return { ...ev, title: `${parts.title} | ${parts.location}` }
      }),
    [baseEvents, resolvePopoverRowParts]
  )

  /** 초등학교별 색상 인덱스 (학교명 알파벳순으로 0~N 배정) */
  const entityToColorIndex = useMemo(() => {
    const keys = new Set(schools.map(s => s.schoolName))
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % SCHEDULE_COLORS.length))
    return map
  }, [schools])

  const getColorForEvent = (event: CalendarEvent) => {
    const idx = entityToColorIndex.get(event.originalItem.row.schoolName) ?? 0
    return SCHEDULE_COLORS[idx % SCHEDULE_COLORS.length]
  }

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter(
        ev =>
          selectedDate.isSameOrAfter(dayjs(ev.startDate), 'day') &&
          selectedDate.isSameOrBefore(dayjs(ev.endDate), 'day')
      ),
    [events, selectedDate]
  )

  const institutionSchoolFilterOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        eventsForSelectedDate.map(ev => ev.originalItem.row.schoolName.trim()).filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    return names.map(school => {
      const idx = entityToColorIndex.get(school) ?? 0
      const pair = SCHEDULE_COLORS[idx % SCHEDULE_COLORS.length]
      return {
        value: school,
        label: school,
        tagColor: pair.bg,
        tagTextColor: pair.text,
      }
    })
  }, [eventsForSelectedDate, entityToColorIndex])

  useEffect(() => {
    setDefaultRightSelectedSchools(institutionSchoolFilterOptions.map(o => o.value))
  }, [institutionSchoolFilterOptions])

  const filteredEventsForDefaultRight = useMemo(() => {
    if (defaultRightSelectedSchools.length === 0) return []
    const sel = new Set(defaultRightSelectedSchools)
    return eventsForSelectedDate.filter(ev => {
      const n = ev.originalItem.row.schoolName.trim()
      return n !== '' && sel.has(n)
    })
  }, [eventsForSelectedDate, defaultRightSelectedSchools])

  const eventListForList = useMemo(
    () =>
      filteredEventsForDefaultRight.map(ev => ({
        ...ev,
        originalItem: {
          ...ev.originalItem,
          educationGrade: ev.originalItem.educationGrade,
          desiredEducationPeriod: ev.originalItem.desiredEducationPeriod,
        },
      })),
    [filteredEventsForDefaultRight]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    onDateSelect?.(date)
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  return (
    <div className="participating-institutions-calendar-layout">
      <div
        className="participating-institutions-calendar-card participating-institutions-calendar-card--left"
        ref={mainCalendarRef}
      >
        <ProgramCalendar
          className="participating-institutions-calendar-main"
          events={events}
          selectedRowKeys={selectedRowKeys}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleDateSelect}
          onMonthChange={setCurrentMonth}
          onModeChange={setCalendarMode}
          scheduleOverlay="tooltip"
          tooltipOverlayClassName="participating-institutions-calendar-tooltip-overlay"
          renderEventsTooltipContent={({ events: dayEvents }) => (
            <ParticipatingCalendarEventPopoverContent
              events={dayEvents as CalendarEvent[]}
              titleColorMap={new Map(
                (dayEvents as CalendarEvent[]).map(ev => [String(ev.id), getColorForEvent(ev).text])
              )}
              resolvePopoverRowParts={
                resolvePopoverRowParts
                  ? event => {
                      const parts = resolvePopoverRowParts({
                        schoolRow: event.originalItem.row,
                        date: dayjs(event.startDate),
                      })
                      return { ...parts, valueTone: 'default' }
                    }
                  : undefined
              }
            />
          )}
        />
      </div>
      <div className="participating-institutions-calendar-card participating-institutions-calendar-card--right">
        {rightContent !== undefined ? (
          rightContent
        ) : (
          <div className="participating-institutions-calendar-default-right">
            <div className="participating-institutions-calendar-default-right__school-filter">
              <AppMultiSelect
                value={defaultRightSelectedSchools}
                onChange={setDefaultRightSelectedSchools}
                options={institutionSchoolFilterOptions}
                placeholder="기관 선택"
              />
            </div>
            <ApplicantScheduleList
              selectedDate={selectedDate}
              events={eventListForList}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={onSelectionChange}
              onEventClick={item => item?.row && onSchoolClick(item.row)}
              getColorForEvent={e => getColorForEvent(e as CalendarEvent)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
