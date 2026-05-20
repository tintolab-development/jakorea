import { useMemo } from 'react'
import { Calendar } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import '@/shared/components/calendar/styles/calendar.css'
import './ujat-volunteer-interview-assign-calendar-mini.css'

dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
  weekdaysMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
})
dayjs.locale('en')

export type UjatVolunteerInterviewAssignCalendarMiniProps = {
  currentMonth: Dayjs
  selectedDate: Dayjs
  onMonthChange: (month: Dayjs) => void
  onSelectDate: (date: Dayjs) => void
  /** 봉사자 면접 가능일 — 연한 민트 배경 */
  programDates: Set<string>
  /** 관리자 면접 가능일 — 미지정 시 disabledDate만 적용 */
  clickableDates?: Set<string>
  /** 공휴일 (YYYY-MM-DD) */
  holidayDateKeys?: Set<string>
  /** 면접일 배정 완료일 (YYYY-MM-DD) */
  assignedDateKeys?: Set<string>
  disabledDate?: (date: Dayjs) => boolean
}

function buildInterviewAssignCellWeekendClasses(
  date: Dayjs,
  holidayDateKeys?: Set<string>
): string[] {
  const dateKey = date.format('YYYY-MM-DD')
  const isHoliday = holidayDateKeys?.has(dateKey) ?? false
  const dayOfWeek = date.day()
  if (isHoliday || dayOfWeek === 0) return ['calendar-mini-cell--sunday-or-holiday']
  if (dayOfWeek === 6) return ['calendar-mini-cell--saturday']
  return []
}

function InterviewAssignCalendarMiniCore({
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  programDates,
  holidayDateKeys,
  assignedDateKeys,
  disabledDate,
}: Omit<UjatVolunteerInterviewAssignCalendarMiniProps, 'clickableDates'>) {
  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const dateFullCellRender = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) return null
    const dateKey = date.format('YYYY-MM-DD')
    const hasSchedule = programDates.has(dateKey)
    const hasAssignmentComplete = assignedDateKeys?.has(dateKey) ?? false
    const isSelected = date.isSame(selectedDate, 'day')
    const isToday = date.isSame(dayjs(), 'day')

    return (
      <div
        className={[
          'calendar-mini-cell',
          hasSchedule ? 'calendar-mini-cell--has-schedule' : '',
          hasAssignmentComplete ? 'calendar-mini-cell--assignment-complete' : '',
          isToday ? 'calendar-mini-cell--today' : '',
          isSelected ? 'calendar-mini-cell--selected' : '',
          ...buildInterviewAssignCellWeekendClasses(date, holidayDateKeys),
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="calendar-mini-date">{date.date()}</span>
      </div>
    )
  }

  return (
    <div className="calendar-mini">
      <div className="calendar-mini-header">
        <button type="button" className="calendar-mini-nav-btn" onClick={handlePrevMonth}>
          <LeftOutlined />
        </button>
        <span className="calendar-mini-title">{currentMonth.format('YYYY.MM')}</span>
        <button type="button" className="calendar-mini-nav-btn" onClick={handleNextMonth}>
          <RightOutlined />
        </button>
      </div>
      <Calendar
        fullscreen={false}
        value={currentMonth}
        locale={enUS}
        fullCellRender={dateFullCellRender}
        headerRender={() => null}
        disabledDate={disabledDate}
        onSelect={(date, { source }) => {
          if (source === 'date') {
            if (disabledDate?.(date)) return
            onSelectDate(date)
          }
        }}
      />
    </div>
  )
}

/**
 * UJAT 면접일 배정 모달 전용 미니 캘린더.
 * `ParagraphCalendarMini`와 분리 — 토·일·공휴 색, 배정완료·오늘·선택 스타일은 이 컴포넌트 CSS에만 적용.
 */
export function UjatVolunteerInterviewAssignCalendarMini({
  clickableDates,
  disabledDate: disabledDateProp,
  ...rest
}: UjatVolunteerInterviewAssignCalendarMiniProps) {
  const disabledDate = useMemo(() => {
    if (disabledDateProp) return disabledDateProp
    if (!clickableDates) return undefined
    return (date: Dayjs) => !clickableDates.has(date.format('YYYY-MM-DD'))
  }, [clickableDates, disabledDateProp])

  return (
    <div className="ujat-volunteer-interview-assign-calendar-mini">
      <InterviewAssignCalendarMiniCore {...rest} disabledDate={disabledDate} />
    </div>
  )
}
