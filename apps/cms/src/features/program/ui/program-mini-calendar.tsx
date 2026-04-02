/**
 * 프로그램 미니 캘린더 컴포넌트
 * 우측 상단에 표시되는 작은 월간 달력
 */

import { Calendar } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import './program-calendar-view.css'

dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
  weekdaysMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
})
dayjs.locale('en')

interface ProgramMiniCalendarProps {
  currentMonth: Dayjs
  /** 메인 캘린더와 동기화된 선택일 표시용(미니캘린더에서는 날짜 클릭 불가) */
  selectedDate: Dayjs
  onMonthChange: (month: Dayjs) => void
  programDates: Set<string> // 일정 있는 날짜들 (YYYY-MM-DD 형식)
}

export function ProgramMiniCalendar({
  currentMonth,
  selectedDate,
  onMonthChange,
  programDates,
}: ProgramMiniCalendarProps) {
  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const headerRender = () => {
    return (
      <div className="program-mini-calendar-header">
        <button type="button" className="program-mini-calendar-nav-btn" onClick={handlePrevMonth}>
          <LeftOutlined />
        </button>
        <span className="program-mini-calendar-title">{currentMonth.format('YYYY.MM')}</span>
        <button type="button" className="program-mini-calendar-nav-btn" onClick={handleNextMonth}>
          <RightOutlined />
        </button>
      </div>
    )
  }

  const dateFullCellRender = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) {
      return null
    }

    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const hasSchedule = programDates.has(date.format('YYYY-MM-DD'))

    return (
      <div
        className={[
          'program-mini-calendar-cell',
          isToday ? 'program-mini-calendar-cell--today' : '',
          hasSchedule ? 'program-mini-calendar-cell--has-schedule' : '',
          isSelected ? 'program-mini-calendar-cell--selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="program-mini-calendar-date">{date.date()}</span>
      </div>
    )
  }

  return (
    <div className="program-mini-calendar">
      {headerRender()}
      <Calendar
        fullscreen={false}
        value={currentMonth}
        locale={enUS}
        fullCellRender={dateFullCellRender}
        headerRender={() => null}
      />
    </div>
  )
}
