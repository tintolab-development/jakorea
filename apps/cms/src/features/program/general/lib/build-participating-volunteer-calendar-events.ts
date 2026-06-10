import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { parseParticipatingSessionTimeRange } from '../ui/detail-modal/program-status/participating-institutions-calendar-day-list'
import type { CalendarMainEventInput } from '@/shared/components/calendar/model/calendar-main-event-input'

export type ParticipatingVolunteerCalendarEventItem = {
  row: ParticipatingSchoolRow
  volunteerName: string
  sessionsOnDate: ParticipatingSchoolSession[]
  educationGrade: string
  desiredEducationPeriod: string
}

export type ParticipatingVolunteerCalendarEvent = CalendarMainEventInput & {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: ParticipatingVolunteerCalendarEventItem
}

function parseSessionDate(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

function fallbackSchoolRow(schoolName: string): ParticipatingSchoolRow {
  return {
    id: `volunteer-calendar-school-${schoolName}`,
    no: 0,
    schoolName,
    region: '-',
    educationGrade: '-',
    classCount: 0,
    studentCount: 0,
    lectureRound: '-',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '-',
    sessions: [],
  }
}

/** 참여 봉사자 캘린더 — 봉사 일정별 이벤트 */
export function buildParticipatingVolunteerCalendarEvents(
  schools: readonly ParticipatingSchoolRow[],
  volunteers: readonly ParticipatingVolunteerRow[]
): ParticipatingVolunteerCalendarEvent[] {
  const schoolByName = new Map(schools.map(school => [school.schoolName, school]))
  const events: ParticipatingVolunteerCalendarEvent[] = []

  for (const volunteer of volunteers) {
    for (const session of volunteer.sessions) {
      const primarySchoolName = volunteer.assignedInstitutionNames[0] ?? '-'
      const school = schoolByName.get(primarySchoolName) ?? fallbackSchoolRow(primarySchoolName)
      const sessionDate = parseSessionDate(session.date)
      const times = parseParticipatingSessionTimeRange(session.timeRange)
      const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/g, ' ~ ')
      const periodLabel = session.classNum.endsWith('교시')
        ? session.classNum
        : `${session.classNum}교시`
      const periodStr = `${periodLabel} (${timeRangeDisplay})`
      const dateKey = sessionDate.format('YYYY-MM-DD')

      events.push({
        id: `${volunteer.id}_${dateKey}_r${session.round}`,
        title: volunteer.volunteerName,
        startDate: dateKey,
        endDate: dateKey,
        startTime: times?.startTime,
        endTime: times?.endTime,
        originalItem: {
          row: school,
          volunteerName: volunteer.volunteerName,
          sessionsOnDate: [session],
          educationGrade: school.educationGrade,
          desiredEducationPeriod: periodStr,
        },
      })
    }
  }

  return events
}
