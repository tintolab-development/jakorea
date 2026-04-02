/**
 * 프로그램·날짜별 일정 한 줄 문구 (캘린더 Popover, 우측 리스트 등 공통)
 */

import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'

export type ProgramDayScheduleEventStatus =
  | 'recruiting_start'
  | 'recruiting_end'
  | 'education_scheduled'
  | 'education_ongoing'

export const PROGRAM_DAY_SCHEDULE_STATUS_CONFIG: Record<
  ProgramDayScheduleEventStatus,
  { label: string; color: string; tagColor: string }
> = {
  recruiting_start: {
    label: '모집 시작',
    color: '#52c41a',
    tagColor: 'success',
  },
  recruiting_end: {
    label: '모집 마감',
    color: '#ff4d4f',
    tagColor: 'error',
  },
  education_scheduled: {
    label: '교육 예정',
    color: '#1890ff',
    tagColor: 'processing',
  },
  education_ongoing: {
    label: '교육 진행',
    color: '#01a1af',
    tagColor: 'cyan',
  },
}

export function getProgramDayScheduleEventStatus(
  program: Program,
  date: Dayjs
): ProgramDayScheduleEventStatus {
  const now = dayjs()

  if (program.applicationStartDate && program.applicationEndDate) {
    const appStart = dayjs(program.applicationStartDate)
    const appEnd = dayjs(program.applicationEndDate)

    if (date.isSame(appStart, 'day')) {
      return 'recruiting_start'
    }
    if (date.isSame(appEnd, 'day')) {
      return 'recruiting_end'
    }
  }

  const startDate = dayjs(program.startDate)

  if (startDate.isAfter(now, 'day')) {
    return 'education_scheduled'
  }

  return 'education_ongoing'
}

export function getProgramDayScheduleEventTime(program: Program, date: Dayjs): string {
  if (program.applicationStartDate && date.isSame(dayjs(program.applicationStartDate), 'day')) {
    return '00:00'
  }

  if (program.applicationEndDate && date.isSame(dayjs(program.applicationEndDate), 'day')) {
    return '24:00'
  }

  if (date.isSame(dayjs(program.startDate), 'day')) {
    return '15:00'
  }

  return '00:00'
}

/** 캘린더 셀 호버 미리보기, 우측 리스트 등에서 동일 문구 사용 */
export function getProgramDayScheduleLine(
  program: Program,
  date: Dayjs
): { statusLabel: string; time: string } {
  const status = getProgramDayScheduleEventStatus(program, date)
  return {
    statusLabel: PROGRAM_DAY_SCHEDULE_STATUS_CONFIG[status].label,
    time: getProgramDayScheduleEventTime(program, date),
  }
}
