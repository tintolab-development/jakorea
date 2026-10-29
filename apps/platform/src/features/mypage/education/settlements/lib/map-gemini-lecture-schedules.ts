import type { EducationSettlementItem } from '../model/types'
import type { EducationScheduleItem } from '../../schedules/model/types'
import type { GeminiLectureScheduleItem } from './gemini-settlement-status'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'

const COMPLETED = new Set(['COMPLETED', 'DONE', 'HELD', 'FINISHED'])

function recognizedClassCountOf(item: GeminiLectureScheduleItem): number | null {
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

function formatSessionMeta(item: GeminiLectureScheduleItem): string {
  const trainingTime = item.trainingTimeText?.trim() ?? ''
  const start = item.startAt ? formatDisplayDateTime(item.startAt) : ''
  const end = item.endAt ? formatDisplayDateTime(item.endAt) : ''
  const time = trainingTime || (start && end ? `${start}~${end}` : start || end)
  const sessionCount = recognizedClassCountOf(item)
  const session = trainingTime.includes('차시')
    ? ''
    : sessionCount != null
      ? `${sessionCount}차시`
      : ''
  return [time, session].filter(Boolean).join(' ') || '-'
}

function progressOf(item: GeminiLectureScheduleItem): EducationSettlementItem['progress'] {
  const status = (item.lectureStatus ?? '').trim().toUpperCase()
  if (COMPLETED.has(status)) return 'completed'
  if (item.endAt) {
    const end = Date.parse(item.endAt)
    if (!Number.isNaN(end) && end < Date.now()) return 'completed'
  }
  return 'upcoming'
}

export function mapGeminiLectureSchedulesToSettlementItems(
  rows: readonly GeminiLectureScheduleItem[],
): EducationSettlementItem[] {
  return rows.map((row, index) => {
    const payment = (row.accountPaymentStatus ?? row.settlementStatus ?? '').trim().toUpperCase()
    const progress = progressOf(row)
    let status: EducationSettlementItem['status'] = progress === 'upcoming' ? 'upcoming' : 'unresolved'
    if (payment === 'PAID') status = 'paid'
    else if (payment === 'FAILED') status = 'unresolved'
    else if (payment === 'READY_TO_PAY') status = 'waiting_confirm'
    else if (
      payment === 'WAITING' ||
      payment === 'WAITING_PAYMENT' ||
      payment === 'NOT_READY' ||
      payment === 'ON_HOLD'
    ) {
      status = 'waiting_confirm'
    }
    const institution = row.institutionName?.trim()
    return {
      id: row.scheduleId != null ? String(row.scheduleId) : `gemini-schedule-${index + 1}`,
      scheduleId: row.scheduleId ?? undefined,
      sessionNumber: recognizedClassCountOf(row) ?? index + 1,
      heldAt: row.startAt ?? row.endAt ?? '',
      sessionMeta: formatSessionMeta(row),
      ...(institution ? { institutionLabel: institution } : {}),
      progress,
      status,
    }
  })
}

export function mapGeminiLectureSchedulesToEducationScheduleItems(
  rows: readonly GeminiLectureScheduleItem[],
): EducationScheduleItem[] {
  return rows.map((row, index) => {
    const sessionCount = recognizedClassCountOf(row)
    const sessionLabel = sessionCount != null ? `${sessionCount}차시` : undefined
    const trainingTime = row.trainingTimeText?.trim() || undefined
    const institution = row.institutionName?.trim() || undefined
    return {
      id: row.scheduleId != null ? String(row.scheduleId) : `gemini-lecture-${index + 1}`,
      ...(row.scheduleId != null ? { scheduleId: row.scheduleId } : {}),
      sessionNumber: sessionCount ?? index + 1,
      heldAt: row.startAt ?? row.endAt ?? '',
      title: institution ?? '-',
      ...(sessionLabel ? { sessionLabel, rowLabel: sessionLabel } : {}),
      attendanceStatus: null,
      ...(trainingTime ? { progressTimeLabel: trainingTime } : {}),
      ...(institution ? { locationName: institution } : {}),
    }
  })
}
