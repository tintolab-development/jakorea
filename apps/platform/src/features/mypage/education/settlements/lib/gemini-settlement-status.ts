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
  /** 하위 호환 한 줄 문자열. `lectureFeeBasisItems`가 비었을 때만 표시한다. */
  lectureFeeBasis?: string | null
  /** BE `MemberPortalGeminiLectureFeeBasisItem[]` — 항상 배열, 차시 오름차순(서버 순서 유지) */
  lectureFeeBasisItems?: GeminiLectureFeeBasisItem[]
  businessIncomeLabel?: string | null
  /** BE `businessIncomeYn` (구 `businessIncome` 키도 허용) */
  businessIncome?: boolean | null
  accountPaymentStatus?: string | null
  settlementStatus?: string | null
}

export type GeminiLectureFeeBasisItem = {
  classCount: number
  /** 원 단위 정수. 0 유효, 단가 미설정만 null */
  amount: number | null
}

export type GeminiLectureScheduleItem = {
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  /** BE `MemberPortalGeminiLectureScheduleItem.trainingDate` (yyyy-MM-dd, 서울 기준) */
  trainingDate?: string | null
  trainingStartTime?: string | null
  trainingEndTime?: string | null
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
  /** 일정별 라벨 '계좌 지급 완료' | '확인 대기 중'. 지급 건 없으면 null */
  settlementStatusLabel?: string | null
  /** 일정별 정산 예정 금액(원). 0 유효, 지급 건 없으면 null */
  expectedAmount?: number | null
}

export function displayGeminiSummaryField(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : MISSING
  const trimmed = value?.trim() ?? ''
  return trimmed || MISSING
}

/** 원 단위 정수 → `170,000원`. null·비숫자는 '-' (0 → `0원`) */
export function formatGeminiWon(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return MISSING
  return `${amount.toLocaleString('ko-KR')}원`
}

/** Figma 11001-286941 강의비 책정 기준: `1차시 0원`, 단가 미설정은 `N차시 -` */
export function formatGeminiFeeBasisItem(item: GeminiLectureFeeBasisItem): string {
  return `${item.classCount}차시 ${formatGeminiWon(item.amount)}`
}

/** lectureFeeBasisItems가 있으면 차시별 목록, 비었으면 lectureFeeBasis 한 줄(fallback) */
export function resolveGeminiFeeBasisDisplay(
  summary: Pick<GeminiSettlementSummary, 'lectureFeeBasisItems' | 'lectureFeeBasis'> | null | undefined,
): { items: string[]; fallback: string } {
  const items = (summary?.lectureFeeBasisItems ?? []).map(formatGeminiFeeBasisItem)
  return { items, fallback: items.length > 0 ? '' : displayGeminiSummaryField(summary?.lectureFeeBasis) }
}

const PROCESSING_STATUS_FIGMA_LABEL: Record<string, string> = {
  PARTIAL_CONFIRMATION: '확인진행중',
  AWAITING_CONFIRMATION: '확인대기중',
  ACCOUNT_PAID: '계좌지급완료',
}

/** 지급조서 처리 현황 — Figma 붙여쓰기 표기. 코드로 분기, 모르는 코드는 서버 라벨 그대로 */
export function displayGeminiProcessingStatus(
  summary: Pick<
    GeminiSettlementSummary,
    'paymentStatementProcessingStatusCode' | 'paymentStatementProcessingStatus'
  > | null | undefined,
): string {
  const code = summary?.paymentStatementProcessingStatusCode?.trim().toUpperCase() ?? ''
  return PROCESSING_STATUS_FIGMA_LABEL[code] ?? displayGeminiSummaryField(summary?.paymentStatementProcessingStatus)
}

/** 사업소득자 여부 — Figma '해당 없음'. BE false·'사업소득자 아님'만 치환 */
export function displayGeminiBusinessIncome(
  summary: Pick<GeminiSettlementSummary, 'businessIncome' | 'businessIncomeLabel'> | null | undefined,
): string {
  const label = summary?.businessIncomeLabel?.trim() ?? ''
  if (summary?.businessIncome === false || label === '사업소득자 아님') return '해당 없음'
  return displayGeminiSummaryField(label)
}
