import { useMemo } from 'react'
import { Empty } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  PROGRAM_DAY_SCHEDULE_STATUS_CONFIG,
  getProgramDayScheduleEventStatus,
  getProgramDayScheduleEventTime,
} from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
} from '@/features/program/ui/program-schedule-colors'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface CalendarSubRightListProps {
  selectedDate: Dayjs
  programs: Program[]
  onProgramClick: (program: Program) => void
}

export function CalendarSubRightList({
  selectedDate,
  programs,
  onProgramClick,
}: CalendarSubRightListProps) {
  const dayPrograms = useMemo(() => {
    return programs.filter(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      const isInEducationPeriod =
        selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')

      let isInApplicationPeriod = false
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        isInApplicationPeriod =
          selectedDate.isSameOrAfter(appStart, 'day') && selectedDate.isSameOrBefore(appEnd, 'day')
      }

      return isInEducationPeriod || isInApplicationPeriod
    })
  }, [programs, selectedDate])

  const scheduleListColorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(dayPrograms),
    [dayPrograms]
  )

  return (
    <div className="program-schedule-list">
      {dayPrograms.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        dayPrograms.map(program => {
          const status = getProgramDayScheduleEventStatus(program, selectedDate)
          const time = getProgramDayScheduleEventTime(program, selectedDate)
          const config = PROGRAM_DAY_SCHEDULE_STATUS_CONFIG[status]
          const color = scheduleListColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]

          return (
            <div
              key={program.id}
              className="program-schedule-item"
              data-has-color="true"
              style={{
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
              }}
              onClick={() => onProgramClick(program)}
            >
              <div className="program-schedule-list__event-column">
                <div className="program-schedule-list__event-head" title={program.title ?? ''}>
                  {program.title ?? ''}
                </div>
                <div className="program-schedule-list__event-desc">
                  <span>{config.label}</span>
                  <span>| {time}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

