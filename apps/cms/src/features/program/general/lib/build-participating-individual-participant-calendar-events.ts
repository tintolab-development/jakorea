import dayjs from 'dayjs'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { CalendarMainEventInput } from '@/shared/components/calendar'
import { parseParticipatingSessionTimeRange } from '@/features/program/general/ui/detail-modal/program-status/participating-institutions-calendar-day-list'

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

export type ParticipatingIndividualParticipantCalendarEvent = CalendarMainEventInput & {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: {
    participant: ParticipatingIndividualParticipantRow
    session: ParticipatingSchoolSession
  }
}

export function buildParticipatingIndividualParticipantCalendarEvents(
  participants: ParticipatingIndividualParticipantRow[]
): ParticipatingIndividualParticipantCalendarEvent[] {
  const events: ParticipatingIndividualParticipantCalendarEvent[] = []

  for (const participant of participants) {
    for (const session of participant.sessions ?? []) {
      if (session.status === 'not_planned') continue
      const d = parseSessionDate(session.date)
      if (!d.isValid()) continue

      const dateKey = d.format('YYYY-MM-DD')
      const times = parseParticipatingSessionTimeRange(session.timeRange)

      events.push({
        id: `${participant.id}_${dateKey}_r${session.round}`,
        title: participant.applicantName?.trim() || '참여자',
        startDate: dateKey,
        endDate: dateKey,
        startTime: times?.startTime,
        endTime: times?.endTime,
        originalItem: { participant, session },
      })
    }
  }

  return events
}
