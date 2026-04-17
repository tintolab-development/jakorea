import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function getProgramsForDate(programs: Program[], date: Dayjs): Program[] {
  return programs.filter(program => {
    const start = dayjs(program.startDate)
    const end = dayjs(program.endDate)
    const isInEducationPeriod = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')

    let isInApplicationPeriod = false
    if (program.applicationStartDate && program.applicationEndDate) {
      const appStart = dayjs(program.applicationStartDate)
      const appEnd = dayjs(program.applicationEndDate)
      isInApplicationPeriod =
        date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
    }

    return isInEducationPeriod || isInApplicationPeriod
  })
}

export function useDayPrograms(programs: Program[], date: Dayjs): {
  dayPrograms: Program[]
  hasPrograms: boolean
  colorMap: Map<string, ScheduleColorPair>
} {
  const dayPrograms = useMemo(() => getProgramsForDate(programs, date), [programs, date])
  const colorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(dayPrograms),
    [dayPrograms]
  ) as Map<string, ScheduleColorPair>

  return {
    dayPrograms,
    hasPrograms: dayPrograms.length > 0,
    colorMap,
  }
}

