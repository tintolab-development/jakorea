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
import { toTypedProgramLifecycleStatus } from '@/shared/lib/program-typed-lifecycle'
import { isMultiDayAllDayPeriodWindowForSurvey } from '@/features/program/shared/lib/program-schedule-canonical'

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

/** 항목 programType(저장값) 기준 개인/기관 구분. 쿼리 programType=GENERAL이어도 항목은 하위 유형일 수 있다. */
export type GeneralProgramCalendarParticipantScope = 'individual' | 'organization'

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
  /** 항목 programType 저장값 (GENERAL, GENERAL_INDIVIDUAL, GENERAL_ORGANIZATION, COMPANY_SCHOOL …) */
  programType?: string
  participantScope?: GeneralProgramCalendarParticipantScope
  scheduleId?: number
  sourceType?: string
  scheduleOrigin?: string | null
  scheduleRole?: string | null
  /** TEMP_ASSIGNED·CONFIRMED(기관·교육받은 교사), ASSIGNED·COMPLETED(1사1교). 필터하지 않고 그대로 둔다. */
  assignmentStatus?: string | null
  organizationName?: string | null
  /** 기관 배정 이벤트의 신청 id. 상세 이동·기관 범위 식별용 */
  organizationApplicationId?: number | null
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

const EDUCATION_EVENT_TYPE = 'EDUCATION'
const EDUCATION_PERIOD_EVENT_TYPE = 'EDUCATION_PERIOD'

export function resolveProgramCalendarParticipantScope(
  programType: string | null | undefined
): GeneralProgramCalendarParticipantScope | undefined {
  const normalized = programType?.trim().toUpperCase()
  if (normalized === 'GENERAL' || normalized === 'GENERAL_INDIVIDUAL') return 'individual'
  if (normalized === 'GENERAL_ORGANIZATION') return 'organization'
  return undefined
}

/**
 * 운영 캘린더에서 세션 카드로 그리면 안 되는 항목.
 * - EDUCATION_PERIOD(교육 가능·운영 기간): BE가 더 이상 내려주지 않지만 방어적으로 제외
 * - 여러 날에 걸친 allDay EDUCATION(기간 창): 매일 24시간 카드로 펼치지 않는다
 */
export function isExcludedProgramCalendarItem(item: AdminProgramCalendarItem): boolean {
  const eventType = item.eventType?.trim() ?? ''
  if (eventType === EDUCATION_PERIOD_EVENT_TYPE) return true
  if (eventType !== EDUCATION_EVENT_TYPE) return false
  return isMultiDayAllDayPeriodWindowForSurvey(item)
}

function buildEducationLabel(item: AdminProgramCalendarItem, fallback: string): string {
  const scheduleName = item.scheduleName?.trim() || item.displayLabel?.trim() || fallback
  const organizationName = item.organizationName?.trim()
  if (!organizationName || scheduleName.includes(organizationName)) return scheduleName
  return scheduleName ? `${organizationName} ${scheduleName}` : organizationName
}

function hasExplicitKstClock(value: dayjs.Dayjs | null): boolean {
  if (!value) return false
  return value.hour() !== 0 || value.minute() !== 0 || value.second() !== 0
}

function isDateOnlyOperationalEventType(eventType: string): boolean {
  return (
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
    lifecycleStatus: toTypedProgramLifecycleStatus(item.periodStatus),
  }
}

function mapCalendarItemToEvent(item: AdminProgramCalendarItem): GeneralProgramCalendarEvent | null {
  const eventType = item.eventType?.trim() ?? ''
  const eventId = (item.eventId ?? item.eventKey)?.trim()
  if (!eventId) return null
  if (isExcludedProgramCalendarItem(item)) return null

  const eventDate = item.eventDate?.trim() ? calendarDateOnly(item.eventDate) : ''
  const startKst = toSeoul(item.startAt)
  const endKst = toSeoul(item.endAt)
  // 운영·모집·설문·과제 경계는 기본적으로 날짜 이벤트다.
  // BE가 startAt=00:00(KST)과 allDay=false를 함께 줘도 주간 시간 일정으로 분할하지 않는다.
  // 00:00이 아닌 시각이 있는 마일스톤(예: 모집 시작 14:00)은 시간 카드로 둔다.
  const allDay =
    item.allDay === true ||
    (isDateOnlyOperationalEventType(eventType) && !hasExplicitKstClock(startKst))

  let startDate = ''
  let endDate = ''
  let startTime: string | undefined
  let endTime: string | undefined

  const allDayStartDate = eventDate || startKst?.format('YYYY-MM-DD') || ''
  if (allDay && allDayStartDate) {
    // allDay는 eventDate(Asia/Seoul) 하루. 여러 날 기간 바로 펼치지 않는다.
    startDate = allDayStartDate
    endDate = allDayStartDate
  } else if (startKst) {
    // 시각 회차: startAt/endAt(UTC Instant)을 Asia/Seoul로 변환해 날짜·시각을 정한다.
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
  const scheduleName = buildEducationLabel(item, programTitle)
  const colorKey = resolveProgramCalendarColorKey(item)
  const programType = item.programType?.trim() || undefined

  return {
    id: eventId,
    title: scheduleName,
    programId: item.programId == null ? '' : String(item.programId),
    programTitle,
    scheduleContent: scheduleName,
    timeLabel: formatCalendarEventTimeLabel(startTime, endTime),
    // 주간 격자 카드 제목은 항상 프로그램명(Figma). 종일·마일스톤도 일정명을 쓰지 않는다.
    // 우측 목록·Hover는 scheduleContent(일정명)를 그대로 쓴다.
    timeGridLabel: programTitle || undefined,
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
    programType,
    participantScope: resolveProgramCalendarParticipantScope(programType),
    scheduleId: item.scheduleId ?? undefined,
    sourceType: item.sourceType?.trim() || undefined,
    scheduleOrigin: item.scheduleOrigin ?? null,
    scheduleRole: item.scheduleRole ?? null,
    assignmentStatus: item.assignmentStatus ?? null,
    organizationName: item.organizationName?.trim() || null,
    organizationApplicationId: item.organizationApplicationId ?? null,
  }
}

/**
 * BE 응답만으로 이벤트를 만든다. 빈 배열이면 프로그램 상세·사업기간·educationScheduleLines로 대체 생성하지 않는다.
 * 고유 키는 eventId(=eventKey). scheduleId·날짜로 병합하지 않고, 같은 eventId 중복 응답만 1건으로 둔다.
 */
export function mapAdminProgramCalendarItemsToEvents(
  items: AdminProgramCalendarItem[]
): GeneralProgramCalendarEvent[] {
  const events: GeneralProgramCalendarEvent[] = []
  const seenEventIds = new Set<string>()
  for (const item of items) {
    const event = mapCalendarItemToEvent(item)
    if (!event) continue
    const key = String(event.id)
    if (seenEventIds.has(key)) continue
    seenEventIds.add(key)
    events.push(event)
  }
  return attachProgramOperationStartDates(events).sort((a, b) => {
    const dateDiff = dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    if (dateDiff !== 0) return dateDiff
    return String(a.programTitle).localeCompare(String(b.programTitle), 'ko')
  })
}

/** 월간 칸 라벨: 주간 격자와 같이 프로그램명 우선, 비어 있을 때만 일정명 */
export function resolveGeneralProgramMonthEventLabel(
  event: Pick<GeneralProgramCalendarEvent, 'programTitle' | 'scheduleContent'> | null | undefined,
  fallbackTitle?: string
): string {
  return event?.programTitle?.trim() || event?.scheduleContent?.trim() || fallbackTitle || ''
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
