import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import { parseParticipatingSessionTimeRange } from '../ui/detail-modal/program-status/participating-institutions-calendar-day-list'
import { formatParticipatingSessionClassNumWithTime } from '@/features/program/general/lib/participating-school-session-display'
import type { CalendarMainEventInput } from '@/shared/components/calendar/model/calendar-main-event-input'

export type ParticipatingVolunteerCalendarEventItem = {
  row: ParticipatingSchoolRow
  volunteerId: string
  volunteerName: string
  /** 활동 포기 처리된 봉사자 — 캘린더 우측 카드 「활동 포기」 뱃지 */
  activityWithdrawn?: boolean
  /** 기관형 우측 카드 「거리 · 출강 · 장거리」 — participants 지표(null이면 '-') */
  distanceKm?: number | null
  programDispatchCount?: number | null
  programLongDistanceDispatchCount?: number | null
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
      // classNum이 비거나 교시가 아닌 값(회차·지망 등)이면 `교시`를 붙이지 않는다
      const periodStr = formatParticipatingSessionClassNumWithTime(session.classNum, timeRangeDisplay)
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
          volunteerId: volunteer.id,
          volunteerName: volunteer.volunteerName,
          activityWithdrawn: volunteer.activityWithdrawn === true,
          distanceKm: volunteer.distanceKm ?? null,
          programDispatchCount: volunteer.programDispatchCount ?? null,
          programLongDistanceDispatchCount: volunteer.programLongDistanceDispatchCount ?? null,
          sessionsOnDate: [session],
          educationGrade: school.educationGrade,
          desiredEducationPeriod: periodStr,
        },
      })
    }
  }

  return events
}
