import { DISPLAY_DATE_TIMEZONE } from '../../../../../shared/lib/format-display-date.ts'
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

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function displayOrDash(value: string): string {
  return value.trim() ? value.trim() : EMPTY_DISPLAY
}

export function formatUjatAssignmentDateLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''

  const dateOnly = ISO_DATE_ONLY_RE.exec(trimmed)
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    const weekday = WEEKDAY_KO[new Date(year, month - 1, day).getDay()] ?? ''
    return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekday})`
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ''
  const bag = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_DATE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(bag.find(part => part.type === type)?.value)
  const year = value('year')
  const month = value('month')
  const day = value('day')
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ''
  const weekday = WEEKDAY_KO[new Date(year, month - 1, day).getDay()] ?? ''
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekday})`
}

function formatGradeLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

function formatClassLabel(classLabel: string, className: string, classNo: number | null): string {
  const labeled = classLabel.trim()
  if (labeled) return labeled.endsWith('반') || !/^\d+$/.test(labeled) ? labeled : `${labeled}반`
  const name = className.replace(/반$/, '').trim()
  if (name) return /^\d+$/.test(name) || name.length > 0 ? `${name.replace(/반$/, '')}반` : ''
  if (classNo != null && Number.isFinite(classNo)) return `${classNo}반`
  return ''
}

function formatTextbookQuantity(
  label: string,
  quantity: number | null,
  studentCount: number | null,
): string {
  if (label) return label.endsWith('권') ? label : `${label}권`
  const count = quantity ?? studentCount
  if (count != null && Number.isFinite(count)) return `${count}권`
  return ''
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
  const gradeLabel = formatGradeLabel(readTrimmed(row.gradeLabel) || readTrimmed(row.grade))
  const classNo = typeof row.classNo === 'number' && Number.isFinite(row.classNo) ? row.classNo : null
  const classLabel = formatClassLabel(
    readTrimmed(row.classLabel),
    readTrimmed(row.className),
    classNo,
  )
  const quantity = typeof row.textbookQuantity === 'number' ? row.textbookQuantity : null
  const studentCount = typeof row.studentCount === 'number' ? row.studentCount : null
  return {
    id: String(row.slotId ?? `${scheduleKey}-${gradeLabel}-${classLabel}-${index}`),
    gradeLabel: displayOrDash(gradeLabel),
    classLabel: displayOrDash(classLabel),
    gradeRowSpan: 0,
    volunteerA: displayOrDash(readTrimmed(row.volunteerAName) || readTrimmed(row.volunteerA)),
    volunteerB: displayOrDash(readTrimmed(row.volunteerBName) || readTrimmed(row.volunteerB)),
    textbookName: displayOrDash(readTrimmed(row.textbookName)),
    textbookQuantityLabel: displayOrDash(
      formatTextbookQuantity(readTrimmed(row.textbookQuantityLabel), quantity, studentCount),
    ),
  }
}

function scheduleHasClassRows(item: PortalUjatClassAssignmentSchedule): boolean {
  return Boolean(item.rows?.length || item.slots?.length || item.classes?.length)
}

function isClassRow(item: unknown): item is PortalUjatClassAssignmentRow {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false
  const row = item as PortalUjatClassAssignmentRow
  return (
    row.grade != null ||
    row.gradeLabel != null ||
    row.className != null ||
    row.classLabel != null ||
    row.classNo != null ||
    row.volunteerAName != null ||
    row.volunteerBName != null
  )
}

function readScheduleRows(schedule: PortalUjatClassAssignmentSchedule): PortalUjatClassAssignmentRow[] {
  return schedule.rows ?? schedule.slots ?? schedule.classes ?? []
}

function mapScheduleSection(
  schedule: PortalUjatClassAssignmentSchedule,
  index: number,
): UjatClassAssignmentScheduleSection | null {
  const scheduleKey = String(schedule.scheduleId ?? schedule.date ?? schedule.scheduleStartAt ?? index)
  const dateLabel = formatUjatAssignmentDateLabel(
    readTrimmed(schedule.scheduleStartAt) || readTrimmed(schedule.date),
  )
  const rawRows = readScheduleRows(schedule)
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
    dateLabel,
    attendanceManagerName: displayOrDash(
      readTrimmed(schedule.attendanceManagerName) || readTrimmed(schedule.attendanceManager),
    ),
    totalClassCount: rows.length,
    consentDocumentsDownloadPath:
      readTrimmed(schedule.consentDocumentsDownloadPath) || readTrimmed(schedule.downloadPath),
    rows,
  }
}

function groupFlatSlots(
  slots: PortalUjatClassAssignmentRow[],
): UjatClassAssignmentScheduleSection[] {
  const groups = new Map<string, PortalUjatClassAssignmentSchedule>()
  slots.forEach((slot, index) => {
    const key = String(
      slot.scheduleId ??
        (readTrimmed(slot.scheduleStartAt) || readTrimmed(slot.date) || `slot-${index}`),
    )
    const existing = groups.get(key)
    if (existing) {
      existing.slots = [...(existing.slots ?? []), slot]
      return
    }
    groups.set(key, {
      scheduleId: slot.scheduleId,
      scheduleStartAt: slot.scheduleStartAt,
      date: slot.date,
      attendanceManagerName: slot.attendanceManagerName,
      attendanceManager: slot.attendanceManager,
      consentDocumentsDownloadPath: slot.consentDocumentsDownloadPath,
      downloadPath: slot.downloadPath,
      slots: [slot],
    })
  })
  return [...groups.values()]
    .map((schedule, index) => mapScheduleSection(schedule, index))
    .filter((section): section is UjatClassAssignmentScheduleSection => section != null)
}

/**
 * Portal class-assignments → 봉사자 배정 현황 섹션.
 * volunteer assigned/waiting 목록은 학급 행렬이 아니므로 사용하지 않는다.
 */
export function mapPortalUjatClassAssignments(
  response: PortalUjatClassAssignmentsResponse | null | undefined,
): UjatClassAssignmentScheduleSection[] {
  if (!response) return []

  const nested = response.schedules ?? []
  if (nested.some(scheduleHasClassRows) || nested.length > 0) {
    return nested
      .map((schedule, index) => mapScheduleSection(schedule, index))
      .filter((section): section is UjatClassAssignmentScheduleSection => section != null)
  }

  const flatCandidates = [
    ...(response.slots ?? []),
    ...((response.content ?? []) as unknown[]),
    ...((response.items ?? []) as unknown[]),
  ].filter(isClassRow)

  if (flatCandidates.length === 0) return []
  return groupFlatSlots(flatCandidates)
}
