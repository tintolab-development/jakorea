const MISSING = '-'

export const GEMINI_SETTLEMENT_SUMMARY_PATH = (applicationType: string, applicationId: string) =>
  `/api/portal/me/program-applications/${applicationType}/${applicationId}/gemini-settlement-summary`

export const GEMINI_LECTURE_SCHEDULES_PATH = (applicationType: string, applicationId: string) =>
  `/api/portal/me/program-applications/${applicationType}/${applicationId}/gemini-lecture-schedules`

export type GeminiSettlementSummary = {
  paymentStatementProcessingStatus?: string | null
  paymentStatementProcessingStatusCode?: string | null
  lectureProgressRound?: number | null
  lectureTotalRound?: number | null
  lectureFeeBasis?: string | null
  businessIncomeLabel?: string | null
  businessIncome?: boolean | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}

export type GeminiLectureScheduleItem = {
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  institutionName?: string | null
  grade?: string | null
  sessionNo?: number | null
  recognizedClassCount?: number | null
  trainingTimeText?: string | null
  lectureStatus?: string | null
  instructorRole?: string | null
  institutionAddress?: string | null
  distanceFromHome?: string | number | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}

export function displayGeminiSummaryField(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : MISSING
  const trimmed = value?.trim() ?? ''
  return trimmed || MISSING
}
