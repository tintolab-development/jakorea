import { Calendar } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import './calendar-set.css'

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
          'program-mini-calendar-cell',
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
      <div className="program-mini-calendar-header">
        <button type="button" className="program-mini-calendar-nav-btn" onClick={handlePrevMonth}>
          <LeftOutlined />
        </button>
        <span className="program-mini-calendar-title">{currentMonth.format('YYYY.MM')}</span>
        <button type="button" className="program-mini-calendar-nav-btn" onClick={handleNextMonth}>
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

