import dayjs from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { ApplicantListMenu } from './applicant-list-menu'

/** 강사 캘린더 집계 이벤트용 — `calendarInstitutionSummary` 있으면 팝오버는 기관·인원, 우측 목록은 `calendarInstitutionInstructors`로 강사별 행 */
export type ApplicantInstructorCalendarEventItem = ApplicantInstructorRow & {
  calendarInstitutionSummary?: {
    applicantCount: number
    regionDisplay: string
  }
  /** 해당 일·기관에 포함된 강사 전원(우측 일정 목록 N줄용) */
  calendarInstitutionInstructors?: ApplicantInstructorRow[]
}

export type ApplicantCalendarEvent = {
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

function regionTokenFromAddress(address: string): string {
  const t = address.trim()
  if (!t) return '-'
  return t.split(/\s+/)[0] ?? '-'
}

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

function parseTimeRangeToIso(
  datePart: string,
  timeRange: string
): { startDate: string; endDate: string } {
  const match = timeRange.match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
  if (match) {
    return {
      startDate: `${datePart}T${match[1]}:00`,
      endDate: `${datePart}T${match[2]}:00`,
    }
  }
  return {
    startDate: `${datePart}T00:00:00`,
    endDate: `${datePart}T23:59:59`,
  }
}

function parseInstructorPreferredDateRange(
  row: ApplicantInstructorRow
): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null {
  const dateRange = row.preferredSchools?.[0]?.dateRange
  if (!dateRange) return null
  const period = dateRange.trim()
  const dateMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2}).*~\s*(\d{4})\.(\d{2})\.(\d{2})/)
  if (!dateMatch) return null
  const start = dayjs(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).startOf('day')
  const end = dayjs(`${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`).startOf('day')
  return { start, end }
}

export function buildInstructorInstitutionCalendarEvents(
  rows: ApplicantInstructorRow[]
): ApplicantCalendarEvent[] {
  type Bucket = { schoolName: string; dateKey: string; instructors: ApplicantInstructorRow[] }
  const buckets = new Map<string, Bucket>()

  for (const row of rows) {
    const range = parseInstructorPreferredDateRange(row)
    if (!range) continue
    const schoolName = row.schoolName?.trim()
    if (!schoolName) continue

    let d = range.start
    const end = range.end
    while (d.valueOf() <= end.valueOf()) {
      const dateKey = d.format('YYYY-MM-DD')
      const key = `${dateKey}|${schoolName}`
      const prev = buckets.get(key)
      if (prev) {
        prev.instructors.push(row)
      } else {
        buckets.set(key, { schoolName, dateKey, instructors: [row] })
      }
      d = d.add(1, 'day')
    }
  }

  const events: ApplicantCalendarEvent[] = []

  for (const [key, bucket] of buckets) {
    const sorted = [...bucket.instructors].sort((a, b) => a.id.localeCompare(b.id))
    const representative = sorted[0]!
    const regionShort = regionTokenFromAddress(representative.address)
    const count = bucket.instructors.length
    const dayIso = `${bucket.dateKey}T00:00:00`

    const originalItem: ApplicantInstructorCalendarEventItem = {
      ...representative,
      calendarInstitutionSummary: {
        applicantCount: count,
        regionDisplay: regionShort,
      },
      calendarInstitutionInstructors: sorted,
    }

    events.push({
      id: key,
      title: bucket.schoolName,
      startDate: dayIso,
      endDate: dayIso,
      originalItem,
    })
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

    const byDate = new Map<string, ParticipatingSchoolSession[]>()
    for (const session of sessions) {
      const d = parseSessionDate(session.date)
      if (!d.isValid()) continue
      const dateKey = d.format('YYYY-MM-DD')
      const prev = byDate.get(dateKey)
      if (prev) prev.push(session)
      else byDate.set(dateKey, [session])
    }

    for (const [dateKey, daySessions] of byDate) {
      const first = daySessions[0]!
      const datePart = parseSessionDate(first.date).format('YYYY-MM-DD')
      const { startDate, endDate } = parseTimeRangeToIso(datePart, first.timeRange)
      events.push({
        id: `${row.id}__${dateKey}`,
        title: `${titlePrefix} ${getLabel(row)}`.trim(),
        startDate,
        endDate,
        originalItem: row as unknown as ApplicantCalendarEvent['originalItem'],
      })
    }
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
      const startTime = dateTimeMatch[2]
      const endTime = dateTimeMatch[3]
      startDate = `${datePart}T${startTime}:00`
      endDate = `${datePart}T${endTime}:00`
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
    originalItem: item,
  }
}

export function mapApplicantDataToCalendarEvents(
  data: ApplicantSchoolRow[] | ApplicantInstructorRow[] | GeneralIndividualApplicantRow[],
  currentMenu: ApplicantListMenu | ''
): ApplicantCalendarEvent[] {
  if (currentMenu === 'instructors') {
    return buildInstructorInstitutionCalendarEvents(data as ApplicantInstructorRow[])
  }

  if (currentMenu === 'individual-applications') {
    const rows = data as GeneralIndividualApplicantRow[]
    const fromSessions = buildSessionBasedCalendarEvents(rows, '[참여자]', row => row.applicantName)
    if (fromSessions.length > 0) return fromSessions
    return rows
      .map((item, index) => mapSchoolLikePeriodToEvent(item, '[참여자]', index))
      .filter((ev): ev is ApplicantCalendarEvent => ev != null)
  }

  const rows = data as ApplicantSchoolRow[]
  const fromSessions = buildSessionBasedCalendarEvents(rows, '[참여기관]', row => row.schoolName)
  if (fromSessions.length > 0) return fromSessions
  return rows
    .map((item, index) => mapSchoolLikePeriodToEvent(item, '[참여기관]', index))
    .filter((ev): ev is ApplicantCalendarEvent => ev != null)
}
