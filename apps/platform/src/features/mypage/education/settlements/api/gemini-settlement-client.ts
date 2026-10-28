import { axiosClient } from '@/shared/api/axios-instance'
import {
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
  type GeminiLectureScheduleItem,
  type GeminiSettlementSummary,
} from '../lib/gemini-settlement-status'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const raw = row[key]
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed ? trimmed : null
}

export function parseGeminiSettlementSummary(payload: unknown): GeminiSettlementSummary {
  const row = asRecord(unwrapEnvelope(payload)) ?? {}
  const businessIncome = row.businessIncome
  return {
    paymentStatementProcessingStatusCode: readString(row, 'paymentStatementProcessingStatusCode'),
    lectureFeeBasis:
      row.lectureFeeBasis === null
        ? null
        : readString(row, 'lectureFeeBasis'),
    businessIncome: typeof businessIncome === 'boolean' ? businessIncome : null,
    accountPaymentStatus: readString(row, 'accountPaymentStatus'),
    settlementStatus: readString(row, 'settlementStatus'),
  }
}

export function parseGeminiLectureSchedules(payload: unknown): GeminiLectureScheduleItem[] {
  const body = unwrapEnvelope<unknown>(payload)
  const list = Array.isArray(body)
    ? body
    : Array.isArray(asRecord(body)?.items)
      ? (asRecord(body)!.items as unknown[])
      : Array.isArray(asRecord(body)?.content)
        ? (asRecord(body)!.content as unknown[])
        : []
  return list
    .map(item => asRecord(item))
    .filter((row): row is Record<string, unknown> => row != null)
    .map(row => ({
      scheduleId: typeof row.scheduleId === 'number' ? row.scheduleId : null,
      startAt: readString(row, 'startAt'),
      endAt: readString(row, 'endAt'),
      institutionName: readString(row, 'institutionName'),
      grade: readString(row, 'grade'),
      sessionNo: typeof row.sessionNo === 'number' ? row.sessionNo : null,
      lectureStatus: readString(row, 'lectureStatus'),
      accountPaymentStatus: readString(row, 'accountPaymentStatus'),
      settlementStatus: readString(row, 'settlementStatus'),
    }))
}

export async function fetchGeminiSettlementSummary(
  programId: string,
  signal?: AbortSignal,
): Promise<GeminiSettlementSummary> {
  const { data } = await axiosClient.get(GEMINI_SETTLEMENT_SUMMARY_PATH(programId), { signal })
  return parseGeminiSettlementSummary(data)
}

export async function fetchGeminiLectureSchedules(
  programId: string,
  signal?: AbortSignal,
): Promise<GeminiLectureScheduleItem[]> {
  const { data } = await axiosClient.get(GEMINI_LECTURE_SCHEDULES_PATH(programId), { signal })
  return parseGeminiLectureSchedules(data)
}
