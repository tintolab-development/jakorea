import type {
  UjatClassAssignmentRow,
  UjatClassAssignmentScheduleSection,
} from '../model/types'
import type {
  PortalUjatClassAssignmentRow,
  PortalUjatClassAssignmentSchedule,
  PortalUjatClassAssignmentsResponse,
} from './client'

const EMPTY_DISPLAY = '-'
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
const ISO_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function displayOrDash(value: string): string {
  return value.trim() ? value.trim() : EMPTY_DISPLAY
}

function isNumericKey(value: string): boolean {
  return /^\d+$/.test(value)
}

export function formatUjatAssignmentDateLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  const dateOnly = ISO_DATE_ONLY_RE.exec(trimmed)
  if (!dateOnly) return ''

  const year = Number(dateOnly[1])
  const month = Number(dateOnly[2])
  const day = Number(dateOnly[3])
  const weekday = WEEKDAY_KO[new Date(year, month - 1, day).getDay()] ?? ''
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekday})`
}

function formatGradeLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (isNumericKey(trimmed)) return `${trimmed}학년`
  return ''
}

function formatClassDisplay(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.includes('학년')) return ''
  if (trimmed.endsWith('반')) return trimmed
  if (isNumericKey(trimmed)) return `${trimmed}반`
  return ''
}

function pickGradeLabel(row: PortalUjatClassAssignmentRow): string {
  if (hasOwn(row, 'gradeLabel') && row.gradeLabel != null) {
    return formatGradeLabel(readTrimmed(row.gradeLabel))
  }
  if (hasOwn(row, 'grade') && row.grade != null) {
    const grade = readTrimmed(row.grade)
    return isNumericKey(grade) ? `${grade}학년` : ''
  }
  return ''
}

function pickClassLabel(row: PortalUjatClassAssignmentRow): string {
  if (hasOwn(row, 'classLabel') && row.classLabel != null) {
    return formatClassDisplay(readTrimmed(row.classLabel))
  }
  const fallback = hasOwn(row, 'className')
    ? row.className
    : hasOwn(row, 'classNo')
      ? row.classNo
      : undefined
  if (fallback == null) return ''
  const numeric = readTrimmed(fallback)
  return isNumericKey(numeric) ? `${numeric}반` : ''
}

function pickVolunteerName(
  row: PortalUjatClassAssignmentRow,
  key: 'volunteerAName' | 'volunteerBName',
): string {
  if (!hasOwn(row, key)) return ''
  return readTrimmed(row[key])
}

function pickTextbookQuantity(row: PortalUjatClassAssignmentRow): string {
  if (hasOwn(row, 'textbookQuantityLabel') && row.textbookQuantityLabel != null) {
    const label = readTrimmed(row.textbookQuantityLabel)
    if (!label) return ''
    return label.endsWith('권') ? label : `${label}권`
  }
  if (!hasOwn(row, 'textbookQuantity') || row.textbookQuantity == null) return ''
  const quantity = row.textbookQuantity
  if (typeof quantity === 'number' && Number.isFinite(quantity)) return `${quantity}권`
  const parsed = readTrimmed(quantity)
  return isNumericKey(parsed) ? `${parsed}권` : ''
}

function pickConsentDownloadPath(schedule: PortalUjatClassAssignmentSchedule): string | null {
  if (!hasOwn(schedule, 'consentDocumentsDownloadPath')) return null
  const path = schedule.consentDocumentsDownloadPath
  if (typeof path !== 'string') return null
  const trimmed = path.trim()
  return trimmed || null
}

function gradeSortKey(label: string): number {
  const match = /(\d+)/.exec(label)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function classSortKey(label: string): number {
  const match = /(\d+)/.exec(label)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function applyGradeRowSpans(rows: UjatClassAssignmentRow[]): UjatClassAssignmentRow[] {
  let index = 0
  while (index < rows.length) {
    const gradeLabel = rows[index].gradeLabel
    let span = 1
    while (index + span < rows.length && rows[index + span].gradeLabel === gradeLabel) {
      span += 1
    }
    rows[index].gradeRowSpan = span
    index += span
  }
  return rows
}

function mapClassRow(
  row: PortalUjatClassAssignmentRow,
  index: number,
  scheduleKey: string,
): UjatClassAssignmentRow {
  const gradeLabel = pickGradeLabel(row)
  const classLabel = pickClassLabel(row)
  return {
    id: String(row.slotId ?? `${scheduleKey}-${gradeLabel}-${classLabel}-${index}`),
    gradeLabel: displayOrDash(gradeLabel),
    classLabel: displayOrDash(classLabel),
    gradeRowSpan: 0,
    volunteerA: displayOrDash(pickVolunteerName(row, 'volunteerAName')),
    volunteerB: displayOrDash(pickVolunteerName(row, 'volunteerBName')),
    textbookName: displayOrDash(readTrimmed(row.textbookName)),
    textbookQuantityLabel: displayOrDash(pickTextbookQuantity(row)),
  }
}

function mapScheduleSection(
  schedule: PortalUjatClassAssignmentSchedule,
  index: number,
): UjatClassAssignmentScheduleSection | null {
  const scheduleKey = String(schedule.scheduleId ?? index)
  const dateLabel = formatUjatAssignmentDateLabel(schedule.date)
  const rawRows = Array.isArray(schedule.rows) ? schedule.rows : []
  const rows = applyGradeRowSpans(
    rawRows
      .map((row, rowIndex) => mapClassRow(row, rowIndex, scheduleKey))
      .sort((a, b) => {
        const grade = gradeSortKey(a.gradeLabel) - gradeSortKey(b.gradeLabel)
        if (grade !== 0) return grade
        return classSortKey(a.classLabel) - classSortKey(b.classLabel)
      }),
  )
  if (!dateLabel && rows.length === 0) return null
  return {
    id: scheduleKey,
    dateLabel: displayOrDash(dateLabel),
    attendanceManagerName: displayOrDash(readTrimmed(schedule.attendanceManagerName)),
    totalClassCount: rows.length,
    consentDocumentsDownloadPath: pickConsentDownloadPath(schedule),
    rows,
  }
}

/**
 * Portal class-assignments → 봉사자 배정 현황 섹션.
 * GET `schedules[].rows`만 사용. slots/content/items·studentCount·assigned/waiting은 쓰지 않는다.
 */
export function mapPortalUjatClassAssignments(
  response: PortalUjatClassAssignmentsResponse | null | undefined,
): UjatClassAssignmentScheduleSection[] {
  if (!response || !Array.isArray(response.schedules)) return []

  return response.schedules
    .map((schedule, index) => mapScheduleSection(schedule, index))
    .filter((section): section is UjatClassAssignmentScheduleSection => section != null)
}
