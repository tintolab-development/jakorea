import dayjs from 'dayjs'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ApplicantListMenu } from './applicant-list-menu'
import {
  resolveSessionCalendarDateKey,
  resolveSessionCalendarIsoRange,
} from './applicant-institution-calendar-session'
import { mapPreferredEducationSchedulesToSessions } from '@/features/program/general/api/adapters/general-applications-adapters'

/** 강사 캘린더 집계 이벤트용 — `calendarInstitutionSummary` 있으면 팝오버는 기관·인원, 우측 목록은 `calendarInstitutionInstructors`로 강사별 행 */
export type ApplicantInstructorCalendarEventItem = ApplicantInstructorRow & {
  /** 일·기관 bucket의 희망 배정 학교명 (`row.schoolName`과 다를 수 있음) */
  calendarBucketSchoolName?: string
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
  const fromRow = item?.schoolName?.trim()
  if (fromRow && fromRow !== '-') return fromRow
  const fromPreferred = item?.preferredSchools
    ?.map(p => p.schoolName?.trim())
    .find(name => Boolean(name && name !== '-'))
  if (fromPreferred) return fromPreferred
  return INSTRUCTOR_CALENDAR_INSTITUTION_FALLBACK_LABEL
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

const MAX_INSTRUCTOR_CALENDAR_DAY_SPAN = 366

/** 월간 셀·필터 라벨 — 희망 기관명이 아니라 신청 강사명 */
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

export function resolveGeneralInstructorCalendarEventTitle(
  item: ApplicantInstructorCalendarEventItem | undefined,
  fallbackTitle = ''
): string {
  if (!item) return fallbackTitle.trim()
  const fromBucket = formatGeneralInstructorCalendarEventTitle(
    item.calendarInstitutionInstructors ?? []
  )
  if (fromBucket) return fromBucket
  const single = item.instructorName?.trim()
  if (single) return single
  return fallbackTitle.trim()
}

function regionTokenFromAddress(address: string | undefined): string {
  const t = (address ?? '').trim()
  if (!t) return '-'
  return t.split(/\s+/)[0] ?? '-'
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

function parseInstructorPreferredDateRange(
  row: ApplicantInstructorRow
): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null {
  return parseInstructorDateRangeString(row.preferredSchools?.[0]?.dateRange)
}

export function buildInstructorInstitutionCalendarEvents(
  rows: ApplicantInstructorRow[]
): ApplicantCalendarEvent[] {
  type Bucket = { schoolName: string; dateKey: string; instructors: ApplicantInstructorRow[] }
  const buckets = new Map<string, Bucket>()

  for (const row of rows) {
    const preferredSchools = row.preferredSchools ?? []
    if (preferredSchools.length > 0) {
      for (const school of preferredSchools) {
        const schoolLabel = school.schoolName?.trim() ?? ''
        const hasOrgName = schoolLabel.length > 0 && schoolLabel !== '-'
        const range = parseInstructorDateRangeString(school.dateRange)
        if (!range) continue

        let d = range.start
        const end = range.end
        let dayCount = 0
        while (d.valueOf() <= end.valueOf() && dayCount < MAX_INSTRUCTOR_CALENDAR_DAY_SPAN) {
          const dateKey = d.format('YYYY-MM-DD')
          const bucketSchoolName = hasOrgName ? schoolLabel : ''
          const key = hasOrgName
            ? `${dateKey}|${schoolLabel}`
            : `${dateKey}|instructor-${row.id}`
          const prev = buckets.get(key)
          if (prev) {
            prev.instructors.push(row)
          } else {
            buckets.set(key, { schoolName: bucketSchoolName, dateKey, instructors: [row] })
          }
          d = d.add(1, 'day')
          dayCount += 1
        }
      }
      continue
    }

    const range = parseInstructorPreferredDateRange(row)
    if (!range) continue
    const schoolName = row.schoolName?.trim()
    if (!schoolName) continue

    let d = range.start
    const end = range.end
    let dayCount = 0
    while (d.valueOf() <= end.valueOf() && dayCount < MAX_INSTRUCTOR_CALENDAR_DAY_SPAN) {
      const dateKey = d.format('YYYY-MM-DD')
      const key = `${dateKey}|${schoolName}`
      const prev = buckets.get(key)
      if (prev) {
        prev.instructors.push(row)
      } else {
        buckets.set(key, { schoolName, dateKey, instructors: [row] })
      }
      d = d.add(1, 'day')
      dayCount += 1
    }
  }

  const events: ApplicantCalendarEvent[] = []

  for (const [key, bucket] of buckets) {
    const sorted = [...bucket.instructors].sort((a, b) => a.id.localeCompare(b.id))
    const representative = sorted[0]!
    const regionShort = regionTokenFromAddress(representative.address)
    const count = bucket.instructors.length
    const dayIso = `${bucket.dateKey}T00:00:00`

    const bucketSchoolName = bucket.schoolName.trim()
    const originalItem: ApplicantInstructorCalendarEventItem = {
      ...representative,
      schoolName: bucketSchoolName || representative.schoolName || '',
      calendarBucketSchoolName: bucketSchoolName || undefined,
      calendarInstitutionSummary: {
        applicantCount: count,
        regionDisplay: regionShort,
      },
      calendarInstitutionInstructors: sorted,
    }

    const title =
      formatGeneralInstructorCalendarEventTitle(sorted) || bucket.schoolName || '강사'

    events.push({
      id: key,
      title,
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
