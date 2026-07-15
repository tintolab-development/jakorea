import { useMemo } from 'react'
import dayjs from 'dayjs'
import {
  CalendarMain,
  CalendarMini,
  CalendarSplitCardLayout,
  useCalendarNavigationState,
  type CalendarMainEventInput,
} from '@/shared/components/calendar'
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
      id: 'ds-range',
      title: '다일 프로그램',
      startDate: d0,
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
        좁은 DS 본문에서는 <code>layout-content</code>와 같이 가로 스크롤로 수용합니다. 도메인
        SubRight 리스트·tooltip은 DS에 포함하지 않습니다.
      </p>

      <DsDemo label="CalendarMain — 월간 / 주간">
        <div className="ds-calendar-demo">
          <CalendarMain
            events={events}
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
                  <p className="ds-demo__label">목록 슬롯 (placeholder)</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-body)' }}>
                    실제 화면의 도메인 SubRight 리스트 자리입니다. DS에는 넣지 않습니다.
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </DsDemo>
    </DsSection>
  )
}
