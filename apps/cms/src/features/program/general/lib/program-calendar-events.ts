import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Program } from '@/types/domain'
import type { CalendarItem, CalendarMainEventInput } from '@/shared/components/calendar'
import { formatCalendarEventTimeLabel } from '@/shared/components/calendar'
import {
  SCHEDULE_COLORS,
  getScheduleColorPair,
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
  programOperationStartDate?: string
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

/** 검색 체크·칸 칩·우측 목록 공통. 일정 종류(colorKey)가 아니라 프로그램 id. */
export function resolveProgramCalendarDisplayColors(
  programId: string | undefined,
  programColorMap: Map<string, ScheduleColorPair>
): ScheduleColorPair {
  if (!programId) return SCHEDULE_COLORS[0]
  return programColorMap.get(programId) ?? getScheduleColorPair(programId)
}

function readOptionalCalendarDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  return calendarDateOnly(value)
}

function readApiProgramOperationStartDate(item: AdminProgramCalendarItem): string {
  const record = item as AdminProgramCalendarItem & {
    businessStartDate?: string | null
    operationStartDate?: string | null
    programStartDate?: string | null
  }
  return (
    readOptionalCalendarDate(record.businessStartDate) ||
    readOptionalCalendarDate(record.operationStartDate) ||
    readOptionalCalendarDate(record.programStartDate)
  )
}

function isBusinessStartEventType(eventType: string): boolean {
  return eventType === 'BUSINESS_START' || eventType === 'BUSINESS'
}

function isDateOnlyOperationalEventType(eventType: string): boolean {
  return (
    eventType === 'EDUCATION_PERIOD' ||
    eventType.startsWith('BUSINESS') ||
    eventType.startsWith('RECRUITMENT') ||
    eventType.startsWith('SURVEY') ||
    eventType.startsWith('ASSIGNMENT')
  )
}

function attachProgramOperationStartDates(
  events: GeneralProgramCalendarEvent[]
): GeneralProgramCalendarEvent[] {
  const starts = new Map<string, string>()
  for (const event of events) {
    const fromEvent =
      isBusinessStartEventType(event.eventType) && event.startDate
        ? calendarDateOnly(event.startDate)
        : ''
    const next = fromEvent || event.programOperationStartDate || ''
    if (!next || !event.programId) continue
    const prev = starts.get(event.programId)
    if (!prev || next < prev) starts.set(event.programId, next)
  }
  return events.map(event => {
    const start = starts.get(event.programId) || event.programOperationStartDate
    if (!start) return event
    return {
      ...event,
      programOperationStartDate: start,
      originalItem: { ...event.originalItem, startDate: start },
    }
  })
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

  // 운영·모집·설문·과제 경계와 교육기간은 날짜 이벤트다.
  // BE가 startAt=00:00과 allDay=false를 함께 줘도 주간 시간 일정으로 분할하지 않는다.
  const allDay = item.allDay === true || isDateOnlyOperationalEventType(eventType)
  const eventDate = item.eventDate?.trim() ? calendarDateOnly(item.eventDate) : ''
  const startKst = toSeoul(item.startAt)
  const endKst = toSeoul(item.endAt)

  let startDate = ''
  let endDate = ''
  let startTime: string | undefined
  let endTime: string | undefined

  const allDayStartDate = eventDate || startKst?.format('YYYY-MM-DD') || ''
  if (allDay && allDayStartDate) {
    startDate = allDayStartDate
    if (eventType === 'EDUCATION_PERIOD' && endKst) {
      const exclusiveKstMidnight =
        endKst.hour() === 0 && endKst.minute() === 0 && endKst.second() === 0
      endDate = exclusiveKstMidnight
        ? endKst.subtract(1, 'day').format('YYYY-MM-DD')
        : endKst.format('YYYY-MM-DD')
    } else {
      endDate = allDayStartDate
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
    programOperationStartDate: readApiProgramOperationStartDate(item) || undefined,
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
  return attachProgramOperationStartDates(events).sort((a, b) => {
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
