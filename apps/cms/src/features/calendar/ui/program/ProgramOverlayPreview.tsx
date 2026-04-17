import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import { SCHEDULE_COLORS, buildResolvedScheduleColorMapForPrograms } from '@/features/program/ui/program-schedule-colors'

export function ProgramOverlayPreview({ date, programs }: { date: Dayjs; programs: Program[] }) {
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(programs)
  return (
    <div className="program-calendar-cell-preview">
      {programs.map(program => {
        const { statusLabel, time } = getProgramDayScheduleLine(program, date)
        const title = program.title ?? ''
        const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
        return (
          <button key={program.id} type="button" className="program-calendar-cell-preview__item">
            <span className="program-calendar-cell-preview__title" style={{ color: colorPair.text }}>
              [{title}]
            </span>
            <span className="program-calendar-cell-preview__desc">
              {statusLabel} | {time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

