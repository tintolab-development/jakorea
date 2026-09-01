import dayjs from 'dayjs'
import type { DateValue } from '@/types'
import type { Program } from '@/types/domain'
import type { CalendarItem, CalendarMainEventInput } from '@/shared/components/calendar'

export type GeneralProgramCalendarView = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

export type GeneralProgramCalendarEventKind =
  | 'recruitment'
  | 'operation'
  | 'education'
  | 'survey'
  | 'assignment'

export type GeneralProgramCalendarEvent = CalendarMainEventInput & {
  programId: string
  programTitle: string
  scheduleContent: string
  timeLabel: string
  operationPeriodLabel: string
  kind: GeneralProgramCalendarEventKind
  originalItem: Program
}

type CalendarEventSeed = {
  id: string
  date: DateValue
  scheduleContent: string
  kind: GeneralProgramCalendarEventKind
  startTime?: string
  endTime?: string
  timeLabel?: string
}

function toDate(value: DateValue): dayjs.Dayjs {
  return dayjs(value instanceof Date ? value.toISOString() : value)
}

function formatDate(value: DateValue): string {
  const d = toDate(value)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD')
}

export function formatGeneralProgramOperationPeriod(program: Program): string {
  return `${formatDate(program.startDate)} ~ ${formatDate(program.endDate)}`
}

function formatTimeLabel(startTime?: string, endTime?: string): string {
  const start = startTime?.trim()
  const end = endTime?.trim()
  if (start && end) return `${start} ~ ${end}`
  if (start) return start
  return '종일'
}

function dateTimeForEvent(date: DateValue, time?: string, isEnd = false): string {
  const d = toDate(date)
  if (!d.isValid()) return ''
  const safeTime = time?.trim() || (isEnd ? '23:59:59' : '00:00:00')
  const normalizedTime = /^\d{1,2}:\d{2}$/.test(safeTime) ? `${safeTime}:00` : safeTime
  return `${d.format('YYYY-MM-DD')}T${normalizedTime}`
}

function createEvent(program: Program, seed: CalendarEventSeed): GeneralProgramCalendarEvent | null {
  const startDate = dateTimeForEvent(seed.date, seed.startTime)
  const endDate = dateTimeForEvent(seed.date, seed.endTime, true)
  if (!startDate || !endDate) return null

  const programTitle = program.title?.trim() || '프로그램 상세'
  return {
    id: `${program.id}:${seed.id}`,
    title: programTitle,
    programId: String(program.id),
    programTitle,
    scheduleContent: seed.scheduleContent,
    timeLabel: seed.timeLabel ?? formatTimeLabel(seed.startTime, seed.endTime),
    operationPeriodLabel: formatGeneralProgramOperationPeriod(program),
    kind: seed.kind,
    startDate,
    endDate,
    originalItem: program,
    startTime: seed.startTime,
    endTime: seed.endTime,
  }
}

function pushEvent(
  events: GeneralProgramCalendarEvent[],
  program: Program,
  seed: CalendarEventSeed
): void {
  const event = createEvent(program, seed)
  if (event) events.push(event)
}

function addRecruitmentEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  if (program.applicationStartDate) {
    pushEvent(events, program, {
      id: 'participant-recruitment-start',
      date: program.applicationStartDate,
      scheduleContent: '참여자 모집 시작',
      kind: 'recruitment',
    })
  }
  if (program.applicationEndDate) {
    pushEvent(events, program, {
      id: 'participant-recruitment-end',
      date: program.applicationEndDate,
      scheduleContent: '참여자 모집 종료',
      kind: 'recruitment',
    })
  }
  if (program.instructorApplicationStartDate) {
    pushEvent(events, program, {
      id: 'instructor-recruitment-start',
      date: program.instructorApplicationStartDate,
      scheduleContent: '강사 모집 시작',
      kind: 'recruitment',
    })
  }
  if (program.instructorApplicationEndDate) {
    pushEvent(events, program, {
      id: 'instructor-recruitment-end',
      date: program.instructorApplicationEndDate,
      scheduleContent: '강사 모집 종료',
      kind: 'recruitment',
    })
  }
  if (program.volunteerApplicationStartDate) {
    pushEvent(events, program, {
      id: 'volunteer-recruitment-start',
      date: program.volunteerApplicationStartDate,
      scheduleContent: '봉사자 모집 시작',
      kind: 'recruitment',
    })
  }
  if (program.volunteerApplicationEndDate) {
    pushEvent(events, program, {
      id: 'volunteer-recruitment-end',
      date: program.volunteerApplicationEndDate,
      scheduleContent: '봉사자 모집 종료',
      kind: 'recruitment',
    })
  }
}

function addOperationEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  pushEvent(events, program, {
    id: 'operation-start',
    date: program.startDate,
    scheduleContent: '사업 운영 시작',
    kind: 'operation',
  })
  pushEvent(events, program, {
    id: 'operation-end',
    date: program.endDate,
    scheduleContent: '사업 운영 종료',
    kind: 'operation',
  })
}

function parseEducationScheduleLine(
  line: string
): { date: string; startTime?: string; endTime?: string } | null {
  const match = line.match(
    /(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\([^)]*\))?\s*(?:(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2}))?/
  )
  if (!match) return null
  const year = `20${match[1]}`
  const month = match[2].padStart(2, '0')
  const day = match[3].padStart(2, '0')
  return {
    date: `${year}-${month}-${day}T00:00:00`,
    startTime: match[4],
    endTime: match[5],
  }
}

function getEducationContent(program: Program, index: number, total: number): string {
  if (program.generalProgramSessionRound === 'single' || total === 1) {
    return '1회차 교육'
  }

  if (program.generalProgramEducationStructure === 'schedule') {
    const detailName = program.generalCommonInfo?.scheduleDetails?.[index]?.name?.trim()
    if (detailName) return detailName
  }

  return `${index + 1}회차 교육`
}

function addEducationEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  const lines = program.generalCommonInfo?.educationScheduleLines ?? []
  const parsedLines = lines
    .map(line => parseEducationScheduleLine(line))
    .filter((item): item is NonNullable<typeof item> => item != null)

  parsedLines.forEach((item, index) => {
    pushEvent(events, program, {
      id: `education-${index + 1}`,
      date: item.date,
      scheduleContent: getEducationContent(program, index, parsedLines.length),
      kind: 'education',
      startTime: item.startTime,
      endTime: item.endTime,
    })
  })
}

function addSurveyEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  for (const row of program.generalCommonInfo?.calendarSurveySchedules ?? []) {
    if (row.startDate) {
      pushEvent(events, program, {
        id: `survey-${row.id}-start`,
        date: row.startDate,
        scheduleContent: row.title,
        kind: 'survey',
        startTime: row.startTime,
        endTime: row.endTime,
      })
    }
    if (row.endDate) {
      pushEvent(events, program, {
        id: `survey-${row.id}-end`,
        date: row.endDate,
        scheduleContent: row.title,
        kind: 'survey',
        startTime: row.startTime,
        endTime: row.endTime,
      })
    }
  }
}

function addAssignmentEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  for (const row of program.generalCommonInfo?.calendarAssignmentSchedules ?? []) {
    const date = row.dueDate ?? row.endDate ?? row.startDate
    if (!date) continue
    pushEvent(events, program, {
      id: `assignment-${row.id}`,
      date,
      scheduleContent: row.title,
      kind: 'assignment',
      startTime: row.startTime,
      endTime: row.endTime,
    })
  }
}

function addAllProgramEvents(events: GeneralProgramCalendarEvent[], program: Program): void {
  addRecruitmentEvents(events, program)
  addOperationEvents(events, program)
  addSurveyEvents(events, program)
  addAssignmentEvents(events, program)
  addEducationEvents(events, program)
}

function addScheduledProgramEvent(events: GeneralProgramCalendarEvent[], program: Program): void {
  pushEvent(events, program, {
    id: 'scheduled-operation-start',
    date: program.startDate,
    scheduleContent: '운영 시작',
    timeLabel: formatGeneralProgramOperationPeriod(program),
    kind: 'operation',
  })
}

function addCompletedProgramEvent(events: GeneralProgramCalendarEvent[], program: Program): void {
  pushEvent(events, program, {
    id: 'completed-operation-end',
    date: program.endDate,
    scheduleContent: '운영 종료',
    timeLabel: formatGeneralProgramOperationPeriod(program),
    kind: 'operation',
  })
}

export function buildGeneralProgramCalendarEvents(
  programs: Program[],
  view: GeneralProgramCalendarView
): GeneralProgramCalendarEvent[] {
  const events: GeneralProgramCalendarEvent[] = []

  for (const program of programs) {
    if (view === 'SCHEDULED') {
      addScheduledProgramEvent(events, program)
      continue
    }
    if (view === 'COMPLETED') {
      addCompletedProgramEvent(events, program)
      continue
    }
    addAllProgramEvents(events, program)
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
