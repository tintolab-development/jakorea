import dayjs from 'dayjs'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { CalendarMainEventInput } from '@/shared/components/calendar'
import { parseParticipatingSessionTimeRange } from '@/features/program/general/ui/detail-modal/program-status/participating-institutions-calendar-day-list'

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/**
 * 개인형 진행 현황 캘린더(참여자·참여 봉사자 공통) — 사람 1명 × 일정 1건 = 이벤트 1개
 */
export type IndividualPersonCalendarEvent<T> = CalendarMainEventInput & {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: {
    person: T
    personId: string
    personName: string
    session: ParticipatingSchoolSession
  }
}

export function buildIndividualPersonCalendarEvents<T>(
  people: readonly T[],
  accessors: {
    getId: (person: T) => string
    getName: (person: T) => string
    getSessions: (person: T) => readonly ParticipatingSchoolSession[] | null | undefined
  }
): IndividualPersonCalendarEvent<T>[] {
  const events: IndividualPersonCalendarEvent<T>[] = []

  for (const person of people) {
    const personId = accessors.getId(person)
    const personName = accessors.getName(person)
    for (const session of accessors.getSessions(person) ?? []) {
      if (session.status === 'not_planned') continue
      const d = parseSessionDate(session.date)
      if (!d.isValid()) continue

      const dateKey = d.format('YYYY-MM-DD')
      const times = parseParticipatingSessionTimeRange(session.timeRange)

      events.push({
        id: `${personId}_${dateKey}_r${session.round}`,
        title: personName,
        startDate: dateKey,
        endDate: dateKey,
        startTime: times?.startTime,
        endTime: times?.endTime,
        originalItem: { person, personId, personName, session },
      })
    }
  }

  return events
}
