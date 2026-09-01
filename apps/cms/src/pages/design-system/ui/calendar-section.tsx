import { useMemo } from 'react'
import dayjs from 'dayjs'
import {
  CalendarMain,
  CalendarMini,
  CalendarSubRightGeneralProgramEventList,
  CalendarSplitCardLayout,
  renderProgramCalendarEventsDefaultTooltipContent,
  useCalendarNavigationState,
  type CalendarGeneralProgramEventListRow,
  type CalendarMainEventInput,
} from '@/shared/components/calendar'
import type { Program } from '@/types/domain'
import { DsDemo, DsSection } from './section'

function buildDemoEvents(): CalendarMainEventInput[] {
  const base = dayjs()
  const d0 = base.format('YYYY-MM-DD')
  const d1 = base.add(1, 'day').format('YYYY-MM-DD')
  const d3 = base.add(3, 'day').format('YYYY-MM-DD')

  return [
    {
      id: 'ds-all-day',
      title: '종일 이벤트',
      startDate: d0,
      endDate: d0,
      weekGridSurface: { bg: '#e6f7f9', border: '#01a1af', text: '#22404b' },
    },
    {
      id: 'ds-timed-1',
      title: '오전 세션',
      startDate: d0,
      endDate: d0,
      startTime: '09:00',
      endTime: '11:00',
      timeGridLabel: '오전 세션',
      weekGridSurface: { bg: '#f0f5ff', border: '#597ef7', text: '#1d39c4' },
    },
    {
      id: 'ds-timed-2',
      title: '오후 워크숍',
      startDate: d1,
      endDate: d1,
      startTime: '14:00',
      endTime: '16:30',
      timeGridLabel: '오후 워크숍',
      weekGridSurface: { bg: '#f6ffed', border: '#73d13d', text: '#389e0d' },
    },
    {
      // d1부터 — 셀당 표시 한도(2) 초과로 「외 N개」가 뜨지 않게 함
      id: 'ds-range',
      title: '다일 프로그램',
      startDate: d1,
      endDate: d3,
      weekGridSurface: { bg: '#fff7e6', border: '#fa8c16', text: '#d46b08' },
    },
  ]
}

export function CalendarSection() {
  const nav = useCalendarNavigationState('month')
  const monthOnly = useCalendarNavigationState('month')
  const split = useCalendarNavigationState('month')
  const events = useMemo(() => buildDemoEvents(), [])
  const sideEvents = useMemo<CalendarGeneralProgramEventListRow[]>(
    () => [
      {
        id: 'ds-side-1',
        programId: 'ds-program-1',
        programTitle: '경제교육 프로그램',
        scheduleContent: '1회차 교육',
        timeLabel: '09:00–11:00',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        originalItem: {} as Program,
      },
      {
        id: 'ds-side-2',
        programId: 'ds-program-2',
        programTitle: '진로 체험 워크숍',
        scheduleContent: '오리엔테이션',
        timeLabel: '14:00–16:30',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        originalItem: {} as Program,
      },
    ],
    []
  )

  const programDates = useMemo(() => {
    const set = new Set<string>()
    for (const ev of events) {
      let cursor = dayjs(ev.startDate)
      const end = dayjs(ev.endDate)
      while (cursor.isBefore(end, 'day') || cursor.isSame(end, 'day')) {
        set.add(cursor.format('YYYY-MM-DD'))
        cursor = cursor.add(1, 'day')
      }
    }
    return set
  }, [events])

  return (
    <DsSection
      id="calendar"
      title="Calendar"
      description="월간/주간 캘린더 키트. 치수는 CMS shared 토큰 1:1(셀 116×124, split 높이 900px). 실제 화면은 CalendarMain + SplitCard(+ Mini) 조합을 쓰고, CalendarSet은 export만 되어 실사용이 없습니다."
    >
      <p className="ds-note">
        DS 본문 폭을 SplitCard(주간) min-width에 맞춰 확보합니다. 아래 데모는 실제{' '}
        <code>CalendarSubRightGeneralProgramEventList</code>와 캘린더 hover preview API를
        사용합니다.
      </p>

      <DsDemo label="CalendarMain — 월간 / 주간">
        <div className="ds-calendar-demo">
          <CalendarMain
            events={events}
            previewTooltipContent={renderProgramCalendarEventsDefaultTooltipContent}
            selectedDate={nav.selectedDate}
            currentMonth={nav.currentMonth}
            mode={nav.mode}
            onSelectDate={nav.onSelectDate}
            onMonthChange={nav.onMonthChange}
            onModeChange={nav.onModeChange}
            onTodayClick={nav.onTodayClick}
          />
        </div>
      </DsDemo>

      <DsDemo label="CalendarMain — 월간만 (hideModeToggle)">
        <div className="ds-calendar-demo">
          <CalendarMain
            events={events}
            selectedDate={monthOnly.selectedDate}
            currentMonth={monthOnly.currentMonth}
            mode="month"
            hideModeToggle
            onSelectDate={monthOnly.onSelectDate}
            onMonthChange={monthOnly.onMonthChange}
            onModeChange={monthOnly.onModeChange}
            onTodayClick={monthOnly.onTodayClick}
          />
        </div>
      </DsDemo>

      <DsDemo label="SplitCard + Mini + Main">
        <div className="ds-calendar-demo">
          <CalendarSplitCardLayout
            pageScroll
            left={
              <CalendarMain
                className="calendar-split-card-main"
                events={events}
                previewTooltipContent={renderProgramCalendarEventsDefaultTooltipContent}
                selectedDate={split.selectedDate}
                currentMonth={split.currentMonth}
                mode={split.mode}
                onSelectDate={split.onSelectDate}
                onMonthChange={split.onMonthChange}
                onModeChange={split.onModeChange}
                onTodayClick={split.onTodayClick}
              />
            }
            right={
              <div className="ds-calendar-side">
                <CalendarMini
                  currentMonth={split.currentMonth}
                  selectedDate={split.selectedDate}
                  onMonthChange={split.onMonthChange}
                  onSelectDate={split.onSelectDate}
                  programDates={programDates}
                />
                <div className="ds-calendar-side__list">
                  <p className="ds-demo__label">선택일 프로그램 일정</p>
                  <CalendarSubRightGeneralProgramEventList
                    selectedDate={split.selectedDate}
                    events={sideEvents}
                    onEventClick={() => undefined}
                  />
                </div>
              </div>
            }
          />
        </div>
      </DsDemo>
    </DsSection>
  )
}
