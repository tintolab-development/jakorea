import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { SCHEDULE_COLORS, type ScheduleColorPair } from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

type SpanRole = 'start' | 'middle' | 'end' | 'single'

function getProgramSpanRole(program: Program, date: Dayjs): SpanRole {
  const start = dayjs(program.startDate)
  const end = dayjs(program.endDate)
  const isInEducation = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  let rangeStart: Dayjs
  let rangeEnd: Dayjs

  if (program.applicationStartDate && program.applicationEndDate) {
    const appStart = dayjs(program.applicationStartDate)
    const appEnd = dayjs(program.applicationEndDate)
    const isInApp = date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
    if (isInApp) {
      rangeStart = appStart
      rangeEnd = appEnd
    } else if (isInEducation) {
      rangeStart = start
      rangeEnd = end
    } else {
      return 'single'
    }
  } else if (isInEducation) {
    rangeStart = start
    rangeEnd = end
  } else {
    return 'single'
  }

  if (rangeStart.isSame(rangeEnd, 'day')) return 'single'
  if (date.isSame(rangeStart, 'day')) return 'start'
  if (date.isSame(rangeEnd, 'day')) return 'end'
  return 'middle'
}

interface ProgramListProps {
  dayPrograms: Program[]
  date: Dayjs
  colorMap: Map<string, ScheduleColorPair>
  isMonth: boolean
}

export function ProgramList({ dayPrograms, date, colorMap, isMonth }: ProgramListProps) {
  return (
    <>
      {dayPrograms.slice(0, 2).map(program => {
        const colorPair = colorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
        const className = isMonth
          ? `program-calendar-event program-calendar-event--span-${getProgramSpanRole(program, date)}`
          : 'program-calendar-event'

        return (
          <div key={program.id} className={className} style={{ backgroundColor: colorPair.bg }}>
            <span className="program-calendar-event-title">{program.title}</span>
          </div>
        )
      })}
      {dayPrograms.length > 2 && (
        <div className="program-calendar-event-more">외 {dayPrograms.length - 2}개의 항목</div>
      )}
    </>
  )
}

