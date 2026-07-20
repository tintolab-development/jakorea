import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { parseParticipatingSessionTimeRange } from '../ui/detail-modal/program-status/participating-institutions-calendar-day-list'
import type { CalendarMainEventInput } from '@/shared/components/calendar/model/calendar-main-event-input'

export type ParticipatingInstructorCalendarEventItem = {
  row: ParticipatingSchoolRow
  instructorName: string
  lectureReportSubmitted: boolean
  sessionsOnDate: ParticipatingSchoolSession[]
  educationGrade: string
  desiredEducationPeriod: string
}

export type ParticipatingInstructorCalendarEvent = CalendarMainEventInput & {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: ParticipatingInstructorCalendarEventItem
}

function parseSessionDate(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 참여 강사 캘린더 — 학교 일정 × 배정 강사별 이벤트 */
export function buildParticipatingInstructorCalendarEvents(
  schools: readonly ParticipatingSchoolRow[],
  instructors: readonly ParticipatingInstructorRow[]
): ParticipatingInstructorCalendarEvent[] {
  const schoolByName = new Map(schools.map(school => [school.schoolName, school]))
  const events: ParticipatingInstructorCalendarEvent[] = []

  for (const instructor of instructors) {
    const school = schoolByName.get(instructor.schoolName)
    if (!school?.sessions?.length) continue

    for (const session of school.sessions) {
      const sessionDate = parseSessionDate(session.date)
      const times = parseParticipatingSessionTimeRange(session.timeRange)
      const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/g, ' ~ ')
      const periodLabel = session.classNum.endsWith('교시')
        ? session.classNum
        : `${session.classNum}교시`
      const periodStr = `${periodLabel} (${timeRangeDisplay})`
      const dateKey = sessionDate.format('YYYY-MM-DD')

      events.push({
        id: `${instructor.id}_${school.id}_${dateKey}_r${session.round}`,
        title: school.schoolName?.trim() || '-',
        startDate: dateKey,
        endDate: dateKey,
        startTime: times?.startTime,
        endTime: times?.endTime,
        originalItem: {
          row: school,
          instructorName: instructor.instructorName,
          lectureReportSubmitted: instructor.lectureReportSubmitted ?? false,
          sessionsOnDate: [session],
          educationGrade: school.educationGrade,
          desiredEducationPeriod: periodStr,
        },
      })
    }
  }

  return events
}
