import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Program } from '@/types/domain'
import type { CalendarItem, CalendarMainEventInput } from '@/shared/components/calendar'
import { formatCalendarEventTimeLabel } from '@/shared/components/calendar'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import type { AdminProgramCalendarItem } from '@/features/program/general/api/program-calendar-api-client'

dayjs.extend(utc)
dayjs.extend(timezone)

const SEOUL = 'Asia/Seoul'

export type GeneralProgramCalendarEventKind =
  | 'recruitment'
  | 'operation'
  | 'education'
  | 'survey'
  | 'assignment'
  | 'event'

export type GeneralProgramCalendarEvent = CalendarMainEventInput & {
  programId: string
  programTitle: string
  scheduleContent: string
  timeLabel: string
  operationPeriodLabel: string
  kind: GeneralProgramCalendarEventKind
  colorKey: string
  eventType: string
  originalItem: Program
}

function toSeoul(iso: string | null | undefined) {
  if (!iso?.trim()) return null
  const parsed = dayjs.utc(iso).tz(SEOUL)
  return parsed.isValid() ? parsed : null
}

function calendarDateOnly(value: string): string {
  return value.trim().slice(0, 10)
}

function kindFromEventType(eventType: string): GeneralProgramCalendarEventKind {
  if (eventType.startsWith('RECRUITMENT')) return 'recruitment'
  if (eventType.startsWith('BUSINESS')) return 'operation'
  if (eventType.startsWith('SURVEY')) return 'survey'
  if (eventType.startsWith('ASSIGNMENT')) return 'assignment'
  if (eventType === 'EVENT') return 'event'
  return 'education'
}

export function resolveProgramCalendarColorKey(item: AdminProgramCalendarItem): string {
  const explicit = item.colorKey?.trim()
  if (explicit) return explicit
  const eventType = item.eventType?.trim() ?? ''
  if (eventType.startsWith('BUSINESS')) return 'BUSINESS'
  if (eventType.startsWith('RECRUITMENT')) return 'RECRUITMENT'
  if (eventType === 'EDUCATION' || eventType === 'EDUCATION_PERIOD') return 'EDUCATION'
  if (eventType === 'EVENT') return 'EVENT'
  if (eventType.startsWith('SURVEY')) return 'SURVEY'
  if (eventType.startsWith('ASSIGNMENT')) return 'ASSIGNMENT'
  return 'EDUCATION'
}

const COLOR_KEY_INDEX: Record<string, number> = {
  BUSINESS: 0,
  RECRUITMENT: 2,
  EDUCATION: 4,
  EVENT: 3,
  SURVEY: 1,
  ASSIGNMENT: 3,
}

export function resolveProgramCalendarEventColors(colorKey: string): ScheduleColorPair {
  const idx = COLOR_KEY_INDEX[colorKey] ?? COLOR_KEY_INDEX.EDUCATION
  return SCHEDULE_COLORS[idx] ?? SCHEDULE_COLORS[0]
}

function stubProgramFromCalendarItem(item: AdminProgramCalendarItem): Program {
  const programId = item.programId == null ? '' : String(item.programId)
  return {
    id: programId,
    sponsorId: '',
    title: item.programName?.trim() || '',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '',
    endDate: '',
    status: 'active',
    createdAt: '',
    updatedAt: '',
  }
}

function mapCalendarItemToEvent(item: AdminProgramCalendarItem): GeneralProgramCalendarEvent | null {
  const eventType = item.eventType?.trim() ?? ''
  const eventId = (item.eventId ?? item.eventKey)?.trim()
  if (!eventId) return null

  const allDay = item.allDay === true
  const eventDate = item.eventDate?.trim() ? calendarDateOnly(item.eventDate) : ''
  const startKst = toSeoul(item.startAt)
  const endKst = toSeoul(item.endAt)

  let startDate = ''
  let endDate = ''
  let startTime: string | undefined
  let endTime: string | undefined

  if (allDay && eventDate) {
    startDate = eventDate
    if (eventType === 'EDUCATION_PERIOD' && endKst) {
      const exclusiveKstMidnight =
        endKst.hour() === 0 && endKst.minute() === 0 && endKst.second() === 0
      endDate = exclusiveKstMidnight
        ? endKst.subtract(1, 'day').format('YYYY-MM-DD')
        : endKst.format('YYYY-MM-DD')
    } else {
      endDate = eventDate
    }
  } else if (startKst) {
    startDate = startKst.format('YYYY-MM-DDTHH:mm:ss')
    endDate = (endKst ?? startKst).format('YYYY-MM-DDTHH:mm:ss')
    startTime = startKst.format('HH:mm')
    endTime = endKst?.format('HH:mm')
  } else if (eventDate) {
    startDate = eventDate
    endDate = eventDate
  } else {
    return null
  }

  const programTitle = item.programName?.trim() || ''
  const scheduleName = item.scheduleName?.trim() || item.displayLabel?.trim() || programTitle
  const colorKey = resolveProgramCalendarColorKey(item)

  return {
    id: eventId,
    title: scheduleName,
    programId: item.programId == null ? '' : String(item.programId),
    programTitle,
    scheduleContent: scheduleName,
    timeLabel: formatCalendarEventTimeLabel(startTime, endTime),
    operationPeriodLabel: '',
    kind: kindFromEventType(eventType),
    colorKey,
    eventType,
    startDate,
    endDate,
    originalItem: stubProgramFromCalendarItem(item),
    startTime,
    endTime,
  }
}

export function mapAdminProgramCalendarItemsToEvents(
  items: AdminProgramCalendarItem[]
): GeneralProgramCalendarEvent[] {
  const events: GeneralProgramCalendarEvent[] = []
  for (const item of items) {
    const event = mapCalendarItemToEvent(item)
    if (event) events.push(event)
  }
  return events.sort((a, b) => {
    const dateDiff = dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    if (dateDiff !== 0) return dateDiff
    return String(a.programTitle).localeCompare(String(b.programTitle), 'ko')
  })
}

export function getGeneralProgramCalendarEventFromCalendarItem(
  item: CalendarItem
): GeneralProgramCalendarEvent | null {
  const original = item.original
  if (
    original != null &&
    typeof original === 'object' &&
    'scheduleContent' in original &&
    'originalItem' in original
  ) {
    return original as GeneralProgramCalendarEvent
  }
  return null
}
