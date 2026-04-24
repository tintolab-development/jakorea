import { Calendar } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import '../styles/calendar.css'

dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
  weekdaysMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
})
dayjs.locale('en')

interface CalendarMiniProps {
  currentMonth: Dayjs
  selectedDate: Dayjs
  onMonthChange: (month: Dayjs) => void
  onSelectDate: (date: Dayjs) => void
  programDates: Set<string>
}

export function CalendarMini({
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  programDates,
}: CalendarMiniProps) {
  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const dateFullCellRender = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) return null
    const isSelected = date.isSame(selectedDate, 'day')
    const hasSchedule = programDates.has(date.format('YYYY-MM-DD'))

    return (
      <div
        className={[
          'calendar-mini-cell',
          hasSchedule ? 'calendar-mini-cell--has-schedule' : '',
          isSelected ? 'calendar-mini-cell--selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="calendar-mini-date">{date.date()}</span>
      </div>
    )
  }

  return (
    <div className="calendar-mini-container">
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
        onSelect={(date, { source }) => {
          if (source === 'date') onSelectDate(date)
        }}
      />
    </div>
  )
}
