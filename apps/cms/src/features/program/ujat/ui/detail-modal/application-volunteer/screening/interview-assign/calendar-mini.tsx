import { useMemo, type CSSProperties } from 'react'
import { Calendar } from 'antd'
import enUS from 'antd/es/calendar/locale/en_US'
import { ButtonLeftIcon, ButtonRightIcon } from '@/shared/ui/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import { countMiniCalendarWeekRows } from '@/shared/components/calendar/lib/calendar-mini-layout'
import '@/shared/components/calendar/styles/calendar.css'
import './calendar-mini.css'

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
  /** 프로그램 면접 가능일 — 연한 청색 배경 */
  programDates: Set<string>
  /** 면접 기간 내 프로그램 지정 불가일 — 회색 배경 (기간 외·미지정일은 배경 없음) */
  programUnavailableDateKeys?: Set<string>
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
  programUnavailableDateKeys,
  holidayDateKeys,
  assignedDateKeys,
  disabledDate,
}: Omit<UjatVolunteerInterviewAssignCalendarMiniProps, 'clickableDates'>) {
  const weekRows = useMemo(() => countMiniCalendarWeekRows(currentMonth), [currentMonth])
  const miniStyle = {
    '--calendar-mini-week-rows': weekRows,
  } as CSSProperties

  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'))
  }

  const handleDateCellActivate = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) return
    if (disabledDate?.(date)) return
    onSelectDate(date)
  }

  const dateFullCellRender = (date: Dayjs) => {
    if (!date.isSame(currentMonth, 'month')) return null
    const dateKey = date.format('YYYY-MM-DD')
    const isProgramAvailable = programDates.has(dateKey)
    const isProgramUnavailable = programUnavailableDateKeys?.has(dateKey) ?? false
    const hasAssignmentComplete = assignedDateKeys?.has(dateKey) ?? false
    const isSelected = date.isSame(selectedDate, 'day')
    const isDisabled = disabledDate?.(date) ?? false

    return (
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        className={[
          'calendar-mini-cell',
          isProgramAvailable && !isSelected ? 'calendar-mini-cell--has-schedule' : '',
          isProgramUnavailable && !isSelected ? 'calendar-mini-cell--program-unavailable' : '',
          hasAssignmentComplete && !isSelected ? 'calendar-mini-cell--assignment-complete' : '',
          isSelected ? 'calendar-mini-cell--selected' : '',
          isDisabled ? 'calendar-mini-cell--disabled' : '',
          ...buildInterviewAssignCellWeekendClasses(date, holidayDateKeys),
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseDown={event => {
          event.preventDefault()
          event.stopPropagation()
          handleDateCellActivate(date)
        }}
        onKeyDown={event => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          handleDateCellActivate(date)
        }}
      >
        <span className="calendar-mini-date">{date.date()}</span>
      </div>
    )
  }

  return (
    <div className="calendar-mini" style={miniStyle} data-week-rows={weekRows}>
      <div className="calendar-mini-header">
        <button type="button" className="calendar-mini-nav-btn" onClick={handlePrevMonth}>
          <ButtonLeftIcon style={{ display: 'block', width: 20, height: 20 }} />
        </button>
        <span className="calendar-mini-title">{currentMonth.format('YYYY.MM')}</span>
        <button type="button" className="calendar-mini-nav-btn" onClick={handleNextMonth}>
          <ButtonRightIcon style={{ display: 'block', width: 20, height: 20 }} />
        </button>
      </div>
      <Calendar
        fullscreen={false}
        value={currentMonth}
        locale={enUS}
        fullCellRender={dateFullCellRender}
        headerRender={() => null}
        onSelect={() => {
          /* fullCellRender 셀 onMouseDown에서만 선택 */
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
  /** 면접 기간(클릭 가능일) 밖은 항상 비활성 — prop과 clickableDates를 모두 반영 */
  const disabledDate = useMemo(() => {
    return (date: Dayjs) => {
      if (disabledDateProp?.(date)) return true
      if (clickableDates && !clickableDates.has(date.format('YYYY-MM-DD'))) return true
      return false
    }
  }, [clickableDates, disabledDateProp])

  return (
    <div className="ujat-volunteer-interview-assign-calendar-mini">
      <InterviewAssignCalendarMiniCore {...rest} disabledDate={disabledDate} />
    </div>
  )
}
