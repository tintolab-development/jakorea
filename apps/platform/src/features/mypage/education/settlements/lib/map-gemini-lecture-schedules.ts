import type { EducationSettlementItem } from '../model/types'
import type { EducationScheduleItem } from '../../schedules/model/types'
import type { GeminiLectureScheduleItem } from './gemini-settlement-status'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'

const COMPLETED = new Set(['COMPLETED', 'DONE', 'HELD', 'FINISHED'])

/** 정산 인정 차시. sessionNo(회차)로 대신하지 않는다. */
function recognizedClassCountOf(item: GeminiLectureScheduleItem): number | null {
  if (typeof item.recognizedClassCount === 'number' && Number.isFinite(item.recognizedClassCount)) {
    return item.recognizedClassCount
  }
  const fromText = item.trainingTimeText?.match(/(\d+)\s*차시/)
  if (fromText?.[1]) {
    const parsed = Number(fromText[1])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

function sessionNoOf(item: GeminiLectureScheduleItem): number | null {
  return typeof item.sessionNo === 'number' && Number.isInteger(item.sessionNo) && item.sessionNo > 0
    ? item.sessionNo
    : null
}

/** 회차 번호 — sessionNo, 없으면 서버 응답 순서(1-based). 인정 차시를 넣지 않는다. */
function roundNumberOf(item: GeminiLectureScheduleItem, index: number): number {
  return sessionNoOf(item) ?? index + 1
}

function formatSessionMeta(item: GeminiLectureScheduleItem): string {
  const trainingTime = item.trainingTimeText?.trim() ?? ''
  const start = item.startAt ? formatDisplayDateTime(item.startAt) : ''
  const end = item.endAt ? formatDisplayDateTime(item.endAt) : ''
  const time = trainingTime || (start && end ? `${start}~${end}` : start || end)
  const sessionCount = recognizedClassCountOf(item)
  const sessionNo = sessionNoOf(item)
  const session = trainingTime.includes('차시')
    ? ''
    : sessionCount != null
      ? `${sessionCount}차시`
      : sessionNo != null
        ? `${sessionNo}회차`
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
    const grade = row.grade?.trim()
    const recognizedClassCount = recognizedClassCountOf(row)
    return {
      id: row.scheduleId != null ? String(row.scheduleId) : `gemini-schedule-${index + 1}`,
      scheduleId: row.scheduleId ?? undefined,
      sessionNumber: roundNumberOf(row, index),
      ...(recognizedClassCount != null ? { recognizedClassCount } : {}),
      heldAt: row.startAt ?? row.endAt ?? '',
      sessionMeta: formatSessionMeta(row),
      ...(institution ? { institutionName: institution, institutionLabel: institution } : {}),
      ...(grade ? { grade } : {}),
      progress,
      status,
    }
  })
}

export function mapGeminiLectureSchedulesToEducationScheduleItems(
  rows: readonly GeminiLectureScheduleItem[],
): EducationScheduleItem[] {
  return rows.map((row, index) => {
    const recognizedClassCount = recognizedClassCountOf(row)
    // 인정 차시는 커리큘럼 차시 라벨(sessionLabel/rowLabel)이 아니라 별도 필드로 둔다.
    const recognizedClassCountLabel =
      recognizedClassCount != null ? `${recognizedClassCount}차시` : undefined
    const trainingTime = row.trainingTimeText?.trim() || undefined
    const institution = row.institutionName?.trim() || undefined
    return {
      id: row.scheduleId != null ? String(row.scheduleId) : `gemini-lecture-${index + 1}`,
      ...(row.scheduleId != null ? { scheduleId: row.scheduleId } : {}),
      sessionNumber: roundNumberOf(row, index),
      heldAt: row.startAt ?? row.endAt ?? '',
      title: institution ?? '-',
      ...(recognizedClassCountLabel ? { recognizedClassCountLabel } : {}),
      attendanceStatus: null,
      ...(trainingTime ? { progressTimeLabel: trainingTime } : {}),
      ...(institution ? { locationName: institution } : {}),
    }
  })
}
