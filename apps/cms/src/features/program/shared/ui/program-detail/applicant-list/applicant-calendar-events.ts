import dayjs from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'

/** 강사 캘린더 집계 이벤트용 — `calendarInstitutionSummary` 있으면 팝오버는 기관·인원, 우측 목록은 `calendarInstitutionInstructors`로 강사별 행 */
export type ApplicantInstructorCalendarEventItem = ApplicantInstructorRow & {
  calendarInstitutionSummary?: {
    applicantCount: number
    regionDisplay: string
  }
  /** 해당 일·기관에 포함된 강사 전원(우측 일정 목록 N줄용) */
  calendarInstitutionInstructors?: ApplicantInstructorRow[]
}

function regionTokenFromAddress(address: string): string {
  const t = address.trim()
  if (!t) return '-'
  return t.split(/\s+/)[0] ?? '-'
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

export function buildInstructorInstitutionCalendarEvents(rows: ApplicantInstructorRow[]) {
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

  const events: Array<{
    id: string
    title: string
    startDate: string
    endDate: string
    originalItem: ApplicantInstructorCalendarEventItem
  }> = []

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
      title: `[참여기관] ${bucket.schoolName} | ${regionShort}`,
      startDate: dayIso,
      endDate: dayIso,
      originalItem,
    })
  }

  return events
}

export function mapApplicantDataToCalendarEvents(
  data: ApplicantSchoolRow[] | ApplicantInstructorRow[],
  currentMenu: TabKey | ''
): any[] {
  if (currentMenu === 'instructors') {
    return buildInstructorInstitutionCalendarEvents(data as ApplicantInstructorRow[])
  }

  return data.map((item, index) => {
    let title = ''
    let startDate = null
    let endDate = null
    const id = item.id || item.no || index

    if (
      currentMenu === 'institutions' &&
      'schoolName' in item &&
      'desiredEducationPeriod' in item
    ) {
      const applicant = item as ApplicantSchoolRow
      title = `[참여기관] ${applicant.schoolName}`
      if (applicant.desiredEducationPeriod) {
        const period = applicant.desiredEducationPeriod.trim()
        const dateTimeMatch = period.match(
          /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/
        )

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
    }

    return {
      id,
      title,
      startDate,
      endDate,
      originalItem: item,
    } as any
  })
}
