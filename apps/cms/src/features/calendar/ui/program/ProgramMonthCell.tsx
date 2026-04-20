import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { useDayPrograms } from './useDayPrograms'
import { ProgramList } from './ProgramList'
import { ProgramOverlay } from '../overlay/ProgramOverlay'
import { ProgramOverlayPreview } from './ProgramOverlayPreview'

interface ProgramMonthCellProps {
  date: Dayjs
  currentMonth: Dayjs
  selectedDate: Dayjs
  programs: Program[]
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}

export function ProgramMonthCell({
  date,
  currentMonth,
  selectedDate,
  programs,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: ProgramMonthCellProps) {
  const isCurrentMonth = date.isSame(currentMonth, 'month')
  const isSelected = date.isSame(selectedDate, 'day')
  const isToday = date.isSame(dayjs(), 'day')
  const { dayPrograms, hasPrograms, colorMap } = useDayPrograms(programs, date)

  const cellClass = [
    'program-calendar-cell',
    !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
    isSelected ? 'program-calendar-cell--selected' : '',
    isToday ? 'program-calendar-cell--today' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const cellBody = (
    <div className={cellClass} onClick={() => onSelectDate(date)}>
      <div className="program-calendar-cell-date">{date.date()}</div>
      {hasPrograms && (
        <div className="program-calendar-cell-events">
          <ProgramList dayPrograms={dayPrograms} date={date} colorMap={colorMap} isMonth />
        </div>
      )}
    </div>
  )

  if (!hasPrograms) return cellBody

  return (
    <ProgramOverlay
      scheduleOverlay={scheduleOverlay}
      tooltipOverlayClassName={tooltipOverlayClassName}
      previewContent={<ProgramOverlayPreview date={date} programs={dayPrograms} />}
    >
      <div className="program-calendar-cell-tooltip-trigger">{cellBody}</div>
    </ProgramOverlay>
  )
}

