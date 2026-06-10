import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ParticipatingVolunteerCalendarEvent } from './build-participating-volunteer-calendar-events'

function parseSessionDateKey(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 해당 날짜에 교육 일정이 있는 참여 학교명 목록 */
export function getSchoolNamesForDate(
  schools: readonly ParticipatingSchoolRow[],
  date: Dayjs
): string[] {
  const names = new Set<string>()
  for (const school of schools) {
    for (const session of school.sessions ?? []) {
      if (parseSessionDateKey(session.date).isSame(date, 'day')) {
        names.add(school.schoolName)
        break
      }
    }
  }
  return Array.from(names)
}

/** 해당 날짜에 봉사 일정 이벤트가 있는 기관명 목록 */
export function getSchoolNamesForDateFromVolunteerEvents(
  events: readonly ParticipatingVolunteerCalendarEvent[],
  date: Dayjs
): string[] {
  const names = new Set<string>()
  for (const event of events) {
    if (!dayjs(event.startDate).isSame(date, 'day')) continue
    const schoolName = event.originalItem.row.schoolName?.trim()
    if (schoolName) names.add(schoolName)
  }
  return Array.from(names)
}
