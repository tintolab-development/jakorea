import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import { useDayPrograms } from './useDayPrograms'
import { ProgramList } from './ProgramList'
import { ProgramOverlay } from '../overlay/ProgramOverlay'
import { ProgramOverlayPreview } from './ProgramOverlayPreview'

interface ProgramWeekCellProps {
  date: Dayjs
  selectedDate: Dayjs
  programs: Program[]
  onSelectDate: (date: Dayjs) => void
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
}

export function ProgramWeekCell({
  date,
  selectedDate,
  programs,
  onSelectDate,
  scheduleOverlay,
  tooltipOverlayClassName,
}: ProgramWeekCellProps) {
  const isSelected = date.isSame(selectedDate, 'day')
  const { dayPrograms, hasPrograms, colorMap } = useDayPrograms(programs, date)

  const weekCellInner = (
    <>
      <div
        className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
      >
        {date.date()}
      </div>
      {hasPrograms && (
        <div className="program-calendar-week-cell-events">
          <ProgramList dayPrograms={dayPrograms} date={date} colorMap={colorMap} isMonth={false} />
        </div>
      )}
    </>
  )

  return (
    <div
      className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      {hasPrograms ? (
        <ProgramOverlay
          scheduleOverlay={scheduleOverlay}
          tooltipOverlayClassName={tooltipOverlayClassName}
          previewContent={<ProgramOverlayPreview date={date} programs={dayPrograms} />}
        >
          <div className="program-calendar-week-cell-tooltip-trigger">{weekCellInner}</div>
        </ProgramOverlay>
      ) : (
        weekCellInner
      )}
    </div>
  )
}

