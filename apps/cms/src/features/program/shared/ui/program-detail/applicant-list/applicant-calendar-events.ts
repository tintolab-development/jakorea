import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ApplicantListMenu } from './applicant-list-menu'
import {
  resolveSessionCalendarClockTimes,
  resolveSessionCalendarDateKey,
  resolveSessionCalendarIsoRange,
} from './applicant-institution-calendar-session'
import {
  mapPreferredEducationSchedulesToSessions,
  readOrganizationApplicationConfirmedSessionsForInstructorCalendar,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import type { CalendarMainEventInput } from '@/shared/components/calendar'
import { formatInstitutionRegionForTableDisplay } from '@/shared/lib/format-institution-region-display'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 강사 캘린더 집계 이벤트용 — `calendarInstitutionSummary` 있으면 팝오버는 기관·인원, 우측 목록은 `calendarInstitutionInstructors`로 강사별 행 */
export type ApplicantInstructorCalendarEventItem = ApplicantInstructorRow & {
  /** 일·기관 bucket의 희망 배정 학교명 (`row.schoolName`과 다를 수 있음) */
  calendarBucketSchoolName?: string
  calendarInstitutionRow?: ApplicantSchoolRow
  sessionsOnDate?: ParticipatingSchoolSession[]
  calendarInstitutionSummary?: {
    applicantCount: number
    regionDisplay: string
  }
  /** 해당 일·기관에 포함된 강사 전원(우측 일정 목록 N줄용) */
  calendarInstitutionInstructors?: ApplicantInstructorRow[]
}

const INSTRUCTOR_CALENDAR_INSTITUTION_FALLBACK_LABEL = '기관 미지정'

export function resolveInstructorCalendarInstitutionName(
  item: ApplicantInstructorCalendarEventItem | undefined
): string {
  const bucket = item?.calendarBucketSchoolName?.trim()
  if (bucket) return bucket
  const fromInstitution = item?.calendarInstitutionRow?.schoolName?.trim()
  if (fromInstitution && fromInstitution !== '-') return fromInstitution
  const fromRow = item?.schoolName?.trim()
  if (fromRow && fromRow !== '-') return fromRow
  const fromPreferred = item?.preferredSchools
    ?.map(p => p.schoolName?.trim())
    .find(name => Boolean(name && name !== '-'))
  if (fromPreferred) return fromPreferred
  return INSTRUCTOR_CALENDAR_INSTITUTION_FALLBACK_LABEL
}

export type ApplicantCalendarEvent = CalendarMainEventInput & {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem:
    | ApplicantSchoolRow
    | ApplicantInstructorRow
    | GeneralIndividualApplicantRow
    | ApplicantInstructorCalendarEventItem
}

function sessionClockFields(
  session: ParticipatingSchoolSession
): Pick<CalendarMainEventInput, 'startTime' | 'endTime'> {
  const clocks = resolveSessionCalendarClockTimes(session)
  if (!clocks) return {}
  return { startTime: clocks.startTime, endTime: clocks.endTime }
}

export type MapApplicantCalendarEventsOptions = {
  institutionRows?: ApplicantSchoolRow[]
}

/** @deprecated 우측 카드·레거시 호환 — 신규 캘린더는 기관명 필터용 `resolveGeneralInstructorCalendarEventTitle` 사용 */
export function formatGeneralInstructorCalendarEventTitle(
  instructors: ApplicantInstructorRow[]
): string {
  const names = instructors
    .map(row => row.instructorName?.trim())
    .filter((name): name is string => Boolean(name))
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names[0]} 외 ${names.length - 1}명`
}

export function formatGeneralInstructorCalendarCellTitleParts(
  item: ApplicantInstructorCalendarEventItem | undefined
): { left: string; right?: string } {
  const left = resolveInstructorCalendarInstitutionName(item)
  const rawRegion =
    item?.calendarInstitutionRow?.region?.trim() ||
    item?.calendarInstitutionSummary?.regionDisplay?.trim() ||
    ''
  const right = formatInstitutionRegionForTableDisplay(rawRegion)
  if (!right || right === '-') {
    return { left }
  }
  return { left, right }
}

export function resolveGeneralInstructorCalendarEventTitle(
  item: ApplicantInstructorCalendarEventItem | undefined,
  fallbackTitle = ''
): string {
  const school = resolveInstructorCalendarInstitutionName(item)
  if (school && school !== INSTRUCTOR_CALENDAR_INSTITUTION_FALLBACK_LABEL) {
    return school
  }
  return fallbackTitle.trim()
}

function parseInstructorDateRangeString(
  dateRange: string | undefined
): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null {
  const period = dateRange?.trim()
  if (!period) return null
  const dateMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2}).*~\s*(\d{4})\.(\d{2})\.(\d{2})/)
  if (dateMatch) {
    const start = dayjs(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).startOf('day')
    const end = dayjs(`${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`).startOf('day')
    return { start, end }
  }
  const singleDayMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
  if (singleDayMatch) {
    const day = dayjs(
      `${singleDayMatch[1]}-${singleDayMatch[2]}-${singleDayMatch[3]}`
    ).startOf('day')
    if (!day.isValid()) return null
    return { start: day, end: day }
  }
  return null
}

function dateKeyInPreferredRange(dateKey: string, dateRange?: string): boolean {
  const range = parseInstructorDateRangeString(dateRange)
  if (!range) return false
  const d = dayjs(dateKey)
  return d.isSameOrAfter(range.start, 'day') && d.isSameOrBefore(range.end, 'day')
}

function instructorMatchesInstitutionSession(
  instructor: ApplicantInstructorRow,
  institution: ApplicantSchoolRow,
  session: ParticipatingSchoolSession,
  dateKey: string
): boolean {
  const scheduleId = session.resolvedScheduleId
  const schoolName = institution.schoolName?.trim()
  for (const pref of instructor.preferredSchools ?? []) {
    if (
      scheduleId != null &&
      Number.isFinite(scheduleId) &&
      pref.schoolId === String(Math.trunc(scheduleId))
    ) {
      return true
    }
    const prefName = pref.schoolName?.trim()
    if (schoolName && prefName && prefName === schoolName) {
      if (dateKeyInPreferredRange(dateKey, pref.dateRange)) return true
    }
  }
  return false
}

function buildInstructorCalendarTitleFromParts(parts: { left: string; right?: string }): string {
  if (parts.right) {
    return `${parts.left} | ${parts.right}`
  }
  return parts.left
}

function createCalendarEventRepresentativeInstructor(
  matched: ApplicantInstructorRow[],
  institution: ApplicantSchoolRow,
  eventKey: string
): ApplicantInstructorRow {
  if (matched[0]) return matched[0]
  return {
    id: `calendar-${eventKey}`,
    no: 0,
    instructorName: '',
    lectureExperienceYears: 0,
    educationLevel: '-',
    educationSchoolName: '-',
    contact: '-',
    email: '-',
    address: '',
    approvalStatus: 'pending',
    schoolName: institution.schoolName?.trim() || '',
  }
}

/** 강사 신청 캘린더 — 기관 배정 확정 일정 × 희망 신청 강사 매칭 */
export function buildInstructorInstitutionCalendarEvents(
  institutions: ApplicantSchoolRow[],
  instructors: ApplicantInstructorRow[]
): ApplicantCalendarEvent[] {
  const events: ApplicantCalendarEvent[] = []

  for (const institution of institutions) {
    const confirmedSessions =
      readOrganizationApplicationConfirmedSessionsForInstructorCalendar(institution)
    const schoolName = institution.schoolName?.trim() || '-'
    const regionDisplay = formatInstitutionRegionForTableDisplay(institution.region)

    for (const session of confirmedSessions) {
      const dateKey = resolveSessionCalendarDateKey(session)
      if (!dateKey) continue
      const resolved = resolveSessionCalendarIsoRange(session)
      if (!resolved) continue

      const scheduleKey = session.resolvedScheduleId ?? session.round
      const eventKey = `${dateKey}|${institution.id}|${scheduleKey}`

      const matchedInstructors = instructors
        .filter(row => instructorMatchesInstitutionSession(row, institution, session, dateKey))
        .sort((a, b) => a.id.localeCompare(b.id))

      const representative = createCalendarEventRepresentativeInstructor(
        matchedInstructors,
        institution,
        eventKey
      )

      const originalItem: ApplicantInstructorCalendarEventItem = {
        ...representative,
        schoolName,
        calendarBucketSchoolName: schoolName,
        calendarInstitutionRow: institution,
        sessionsOnDate: [session],
        calendarInstitutionSummary: {
          applicantCount: matchedInstructors.length,
          regionDisplay,
        },
        calendarInstitutionInstructors: matchedInstructors,
      }

      const titleParts = formatGeneralInstructorCalendarCellTitleParts(originalItem)

      events.push({
        id: eventKey,
        title: buildInstructorCalendarTitleFromParts(titleParts),
        startDate: resolved.startDate,
        endDate: resolved.endDate,
        ...sessionClockFields(session),
        originalItem,
      })
    }
  }

  return events
}

function buildSessionBasedCalendarEvents<
  T extends {
    id: string
    sessions?: ParticipatingSchoolSession[]
  },
>(
  rows: T[],
  titlePrefix: string,
  getLabel: (row: T) => string
): ApplicantCalendarEvent[] {
  const events: ApplicantCalendarEvent[] = []

  for (const row of rows) {
    const sessions = (row.sessions ?? []).filter(s => s.status !== 'not_planned')
    if (sessions.length === 0) continue

    sessions.forEach((session, sessionIndex) => {
      const resolved = resolveSessionCalendarIsoRange(session)
      if (!resolved) return
      const { dateKey, startDate, endDate } = resolved
      const roundKey = session.round ?? sessionIndex + 1
      events.push({
        id: `${row.id}__${dateKey}__${roundKey}`,
        title: `${titlePrefix} ${getLabel(row)}`.trim(),
        startDate,
        endDate,
        ...sessionClockFields(session),
        originalItem: row as unknown as ApplicantCalendarEvent['originalItem'],
      })
    })
  }

  return events
}

function mapSchoolLikePeriodToEvent(
  item: ApplicantSchoolRow | GeneralIndividualApplicantRow,
  titlePrefix: string,
  index: number
): ApplicantCalendarEvent | null {
  let title = ''
  let startDate: string | null = null
  let endDate: string | null = null
  let periodStartTime: string | undefined
  let periodEndTime: string | undefined
  const id = item.id || String(item.no ?? index)
  const label =
    'schoolName' in item
      ? item.schoolName
      : 'applicantName' in item
        ? item.applicantName
        : ''

  if (!('desiredEducationPeriod' in item)) return null

  title = `${titlePrefix} ${label}`.trim()
  const period = item.desiredEducationPeriod?.trim()
  if (period) {
    const dateTimeMatch = period.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/)

    if (dateTimeMatch) {
      const datePart = dateTimeMatch[1]
      periodStartTime = dateTimeMatch[2]
      periodEndTime = dateTimeMatch[3]
      startDate = `${datePart}T${periodStartTime}:00`
      endDate = `${datePart}T${periodEndTime}:00`
    } else {
      const rangeMatch = period.match(
        /^(\d{2})\.(\d{2})\.(\d{2})\(.*\)\s*~\s*(\d{2})\.(\d{2})\.(\d{2})\(.*\)/
      )
      if (rangeMatch) {
        startDate = `20${rangeMatch[1]}-${rangeMatch[2]}-${rangeMatch[3]}T00:00:00`
        endDate = `20${rangeMatch[4]}-${rangeMatch[5]}-${rangeMatch[6]}T23:59:59`
      }
    }
  }

  if (!startDate || !endDate) return null

  return {
    id,
    title,
    startDate,
    endDate,
    ...(periodStartTime && periodEndTime
      ? { startTime: periodStartTime, endTime: periodEndTime }
      : {}),
    originalItem: item,
  }
}

export function mapApplicantDataToCalendarEvents(
  data: ApplicantSchoolRow[] | ApplicantInstructorRow[] | GeneralIndividualApplicantRow[],
  currentMenu: ApplicantListMenu | '',
  options?: MapApplicantCalendarEventsOptions
): ApplicantCalendarEvent[] {
  if (currentMenu === 'instructors') {
    const institutions = options?.institutionRows ?? []
    if (institutions.length === 0) return []
    return buildInstructorInstitutionCalendarEvents(
      institutions,
      data as ApplicantInstructorRow[]
    )
  }

  if (currentMenu === 'individual-applications') {
    const rows = data as GeneralIndividualApplicantRow[]
    const fromSessions = buildSessionBasedCalendarEvents(rows, '[참여자]', row => row.applicantName)
    if (fromSessions.length > 0) return fromSessions
    return rows
      .map((item, index) => mapSchoolLikePeriodToEvent(item, '[참여자]', index))
      .filter((ev): ev is ApplicantCalendarEvent => ev != null)
  }

  const rows = enrichInstitutionApplicantRowsForCalendar(data as ApplicantSchoolRow[])
  const fromSessions = buildSessionBasedCalendarEvents(rows, '[참여기관]', row => row.schoolName)
  if (fromSessions.length > 0) return fromSessions
  return rows
    .map((item, index) => mapSchoolLikePeriodToEvent(item, '[참여기관]', index))
    .filter((ev): ev is ApplicantCalendarEvent => ev != null)
}

/** 목록 sessions와 preferredEducationSchedules 불일치 시 캘린더용 sessions 보강 */
function enrichInstitutionApplicantRowsForCalendar(
  rows: ApplicantSchoolRow[]
): ApplicantSchoolRow[] {
  return rows.map(row => {
    const sessions = row.sessions ?? []
    const hasCalendarDate = sessions.some(
      session => resolveSessionCalendarDateKey(session) != null
    )
    if (hasCalendarDate) return row

    const preferred = row.preferredEducationSchedules ?? []
    if (preferred.length === 0) return row

    const fromPreferred = mapPreferredEducationSchedulesToSessions(preferred)
    if (fromPreferred.length === 0) return row

    return { ...row, sessions: fromPreferred }
  })
}
