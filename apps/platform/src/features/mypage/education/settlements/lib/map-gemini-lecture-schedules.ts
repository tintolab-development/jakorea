import type { EducationSettlementItem } from '../model/types'
import type { GeminiLectureScheduleItem } from './gemini-settlement-status'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'

const COMPLETED = new Set(['COMPLETED', 'DONE', 'HELD', 'FINISHED'])

function formatSessionMeta(item: GeminiLectureScheduleItem): string {
  const start = item.startAt ? formatDisplayDateTime(item.startAt) : ''
  const end = item.endAt ? formatDisplayDateTime(item.endAt) : ''
  const time = start && end ? `${start}~${end}` : start || end
  const session = item.sessionNo != null ? `${item.sessionNo}차시` : ''
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
      sessionNumber: row.sessionNo ?? index + 1,
      heldAt: row.startAt ?? row.endAt ?? '',
      sessionMeta: formatSessionMeta(row),
      ...(institution ? { institutionLabel: institution } : {}),
      progress,
      status,
    }
  })
}
