import type { GeminiLectureScheduleItem } from '../../settlements/lib/gemini-settlement-status'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'
import { formatGeminiInstructorRoleLabel } from './instructor-role-label'

export type InstructorAssignmentSource = {
  assignmentId: number
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  sessionNo?: number | null
  recognizedClassCount?: number | null
  trainingTimeText?: string | null
  institutionName?: string | null
  grade?: string | number | null
  instructorRole?: string | null
  institutionAddress?: string | null
  distanceFromHome?: string | number | null
}

export function displayAssignmentText(value: string | number | null | undefined): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  if (typeof value === 'string') return value.trim()
  return ''
}

export function displayOrDash(value: string | number | null | undefined): string {
  return displayAssignmentText(value) || '-'
}

/** `23.40` → `23.4km`. 문자열이 이미 km를 포함하면 그대로 둔다. */
export function formatAssignmentDistanceKm(value: string | number | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const oneDecimal = Math.round(value * 10) / 10
    return `${oneDecimal.toFixed(1).replace(/\.0$/, '')}km`
  }
  const text = displayAssignmentText(value)
  if (!text) return '-'
  if (/km/i.test(text)) return text
  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return text
  const oneDecimal = Math.round(parsed * 10) / 10
  return `${oneDecimal.toFixed(1).replace(/\.0$/, '')}km`
}

function parseDisplayDateTime(value: string | null | undefined): { date: string; time: string } | null {
  if (!value) return null
  const formatted = formatDisplayDateTime(value)
  if (!formatted) return null
  const match = /^(.*) (\d{2}:\d{2})$/.exec(formatted)
  if (!match) return { date: formatted, time: '' }
  return { date: match[1] ?? formatted, time: match[2] ?? '' }
}

function recognizedClassCountOf(item: InstructorAssignmentSource): number | null {
  if (typeof item.recognizedClassCount === 'number' && Number.isFinite(item.recognizedClassCount)) {
    return item.recognizedClassCount
  }
  const fromText = item.trainingTimeText?.match(/(\d+)\s*차시/)
  if (fromText?.[1]) {
    const parsed = Number(fromText[1])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  if (typeof item.sessionNo === 'number' && Number.isFinite(item.sessionNo)) return item.sessionNo
  return null
}

export function formatAssignmentScheduleLine(item: InstructorAssignmentSource): string {
  const start = parseDisplayDateTime(item.startAt)
  const end = parseDisplayDateTime(item.endAt)
  const date = start?.date || end?.date || '-'
  const trainingTime = displayAssignmentText(item.trainingTimeText)
  const clock =
    start?.time && end?.time ? `${start.time}~${end.time}` : start?.time || end?.time || ''
  const time = trainingTime || clock || '-'
  const sessionCount = recognizedClassCountOf(item)
  const session = trainingTime.includes('차시')
    ? ''
    : sessionCount != null
      ? `${sessionCount}차시`
      : '-'

  if (!start && !end && !trainingTime && sessionCount == null) return '-'
  const head = `${date} ${time}`.trim()
  return session ? `${head} | ${session}` : head || '-'
}

export function mapGeminiLectureSchedulesToAssignmentSources(
  rows: readonly GeminiLectureScheduleItem[],
): InstructorAssignmentSource[] {
  return rows.map((row, index) => ({
    assignmentId: row.scheduleId ?? index + 1,
    scheduleId: row.scheduleId ?? null,
    startAt: row.startAt ?? null,
    endAt: row.endAt ?? null,
    sessionNo: row.sessionNo ?? null,
    recognizedClassCount: row.recognizedClassCount ?? null,
    trainingTimeText: row.trainingTimeText ?? null,
    institutionName: row.institutionName ?? null,
    grade: row.grade ?? null,
    instructorRole: row.instructorRole ?? null,
    institutionAddress: row.institutionAddress ?? null,
    distanceFromHome: row.distanceFromHome ?? null,
  }))
}

export function formatAssignmentRole(raw: string | null | undefined): string {
  return formatGeminiInstructorRoleLabel(raw)
}
