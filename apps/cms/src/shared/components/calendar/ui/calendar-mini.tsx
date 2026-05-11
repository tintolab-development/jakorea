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
  /** 구간 선택 UI — 지정 시 해당 구간 셀에 범위 전용 클래스(스타일은 소비측 CSS) */
  rangeSelection?: { start: Dayjs; end: Dayjs } | null
  /** 비활성 날짜 판정 — true 반환 시 antd가 셀 비활성(클릭/선택 차단) + `.ant-picker-cell-disabled` 부여 */
  disabledDate?: (date: Dayjs) => boolean
}

export function CalendarMini({
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  programDates,
  rangeSelection = null,
  disabledDate,
}: CalendarMiniProps) {
  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const dateFullCellRender = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) return null
    const hasSchedule = programDates.has(date.format('YYYY-MM-DD'))

    if (rangeSelection != null) {
      const a = rangeSelection.start
      const b = rangeSelection.end
      const s = a.isBefore(b) || a.isSame(b, 'day') ? a : b
      const e = a.isBefore(b) || a.isSame(b, 'day') ? b : a
      const inRange = !date.isBefore(s, 'day') && !date.isAfter(e, 'day')
      if (inRange) {
        const isStart = date.isSame(s, 'day')
        const isEnd = date.isSame(e, 'day')
        const rangeClass = isStart && isEnd
          ? 'calendar-mini-cell--range-single'
          : isStart
            ? 'calendar-mini-cell--range-start'
            : isEnd
              ? 'calendar-mini-cell--range-end'
              : 'calendar-mini-cell--range-middle'
        return (
          <div
            className={['calendar-mini-cell', hasSchedule ? 'calendar-mini-cell--has-schedule' : '', rangeClass]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="calendar-mini-date">{date.date()}</span>
          </div>
        )
      }
    }

    const isSelected = date.isSame(selectedDate, 'day')

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
