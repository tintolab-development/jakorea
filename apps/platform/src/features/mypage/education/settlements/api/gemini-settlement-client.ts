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

function readNumber(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = row[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = Number(raw.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function readStringOrNumber(row: Record<string, unknown>, key: string): string | number | null {
  const raw = row[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return readString(row, key)
}

export function parseGeminiSettlementSummary(payload: unknown): GeminiSettlementSummary {
  const row = asRecord(unwrapEnvelope(payload)) ?? {}
  const businessIncome = row.businessIncome
  return {
    paymentStatementProcessingStatus: readString(row, 'paymentStatementProcessingStatus'),
    paymentStatementProcessingStatusCode: readString(row, 'paymentStatementProcessingStatusCode'),
    lectureProgressRound: readNumber(row, 'lectureProgressRound'),
    lectureTotalRound: readNumber(row, 'lectureTotalRound'),
    lectureFeeBasis: row.lectureFeeBasis === null ? null : readString(row, 'lectureFeeBasis'),
    businessIncomeLabel: readString(row, 'businessIncomeLabel'),
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
      sessionNo: readNumber(row, 'sessionNo'),
      recognizedClassCount: readNumber(row, 'recognizedClassCount'),
      trainingTimeText: readString(row, 'trainingTimeText'),
      lectureStatus: readString(row, 'lectureStatus'),
      instructorRole: readString(row, 'instructorRole'),
      institutionAddress: readString(row, 'institutionAddress'),
      distanceFromHome: readStringOrNumber(row, 'distanceFromHome'),
      accountPaymentStatus: readString(row, 'accountPaymentStatus'),
      settlementStatus: readString(row, 'settlementStatus'),
    }))
}

export async function fetchGeminiSettlementSummary(
  applicationType: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<GeminiSettlementSummary> {
  const { data } = await axiosClient.get(
    GEMINI_SETTLEMENT_SUMMARY_PATH(applicationType, applicationId),
    { signal },
  )
  return parseGeminiSettlementSummary(data)
}

export async function fetchGeminiLectureSchedules(
  applicationType: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<GeminiLectureScheduleItem[]> {
  const { data } = await axiosClient.get(
    GEMINI_LECTURE_SCHEDULES_PATH(applicationType, applicationId),
    { signal },
  )
  return parseGeminiLectureSchedules(data)
}
