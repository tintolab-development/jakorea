export const LECTURE_FEE_TYPE_CODES = ['GRADE_1', 'GRADE_2', 'GRADE_3'] as const
export type LectureFeeTypeCode = (typeof LECTURE_FEE_TYPE_CODES)[number]

export const INSTRUCTOR_FEE_CALCULATION_UNITS = [
  'PER_HOUR',
  'PER_CLASS',
  'PER_SESSION',
  'PER_LECTURE',
  'FIXED',
] as const
export type InstructorFeeCalculationUnit = (typeof INSTRUCTOR_FEE_CALCULATION_UNITS)[number]

export const LECTURE_FEE_SETTLEMENT_BLOCKER_CODES = [
  'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED',
  'SETTLEMENT_WAGE_RATE_NOT_CONFIGURED',
] as const
export type LectureFeeSettlementBlockerCode = (typeof LECTURE_FEE_SETTLEMENT_BLOCKER_CODES)[number]

export type LectureFeePreview = {
  lectureFeeType: LectureFeeTypeCode | null
  instructorFeeCalculationUnit: InstructorFeeCalculationUnit | null
  instructorFeeAmount: number | null
  totalLectureFee: number | null
  educationSessionCount: number | null
  recognizedSessionCount: number | null
  actualTrainingMinutes: number | null
  settlementBlockerCode: LectureFeeSettlementBlockerCode | null
}

const MISSING = '-'

const LECTURE_FEE_TYPE_LABELS: Record<LectureFeeTypeCode, string> = {
  GRADE_1: '1급 강사비',
  GRADE_2: '2급 강사비',
  GRADE_3: '3급 강사비',
}

export const LECTURE_FEE_SETTLEMENT_BLOCKER_MESSAGE: Record<
  LectureFeeSettlementBlockerCode,
  string
> = {
  SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED: '실적 시작·종료 시간이 없어 정산을 신청할 수 없습니다.',
  SETTLEMENT_WAGE_RATE_NOT_CONFIGURED: '프로그램 강사비 단가가 없어 정산을 신청할 수 없습니다.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseNullableInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  return null
}

function parseLectureFeeType(value: unknown): LectureFeeTypeCode | null {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return (LECTURE_FEE_TYPE_CODES as readonly string[]).includes(raw)
    ? (raw as LectureFeeTypeCode)
    : null
}

function parseFeeUnit(value: unknown): InstructorFeeCalculationUnit | null {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return (INSTRUCTOR_FEE_CALCULATION_UNITS as readonly string[]).includes(raw)
    ? (raw as InstructorFeeCalculationUnit)
    : null
}

function parseBlockerCode(value: unknown): LectureFeeSettlementBlockerCode | null {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return (LECTURE_FEE_SETTLEMENT_BLOCKER_CODES as readonly string[]).includes(raw)
    ? (raw as LectureFeeSettlementBlockerCode)
    : null
}

export function parseLectureFeePreview(value: unknown): LectureFeePreview | null {
  if (value == null) return null
  if (!isRecord(value)) return null
  return {
    lectureFeeType: parseLectureFeeType(value.lectureFeeType),
    instructorFeeCalculationUnit: parseFeeUnit(value.instructorFeeCalculationUnit),
    instructorFeeAmount: parseNullableInteger(value.instructorFeeAmount),
    totalLectureFee: parseNullableInteger(value.totalLectureFee),
    educationSessionCount: parseNullableInteger(value.educationSessionCount),
    recognizedSessionCount: parseNullableInteger(value.recognizedSessionCount),
    actualTrainingMinutes: parseNullableInteger(value.actualTrainingMinutes),
    settlementBlockerCode: parseBlockerCode(value.settlementBlockerCode),
  }
}

export function lectureFeeTypeDisplayLabel(code: string | null | undefined): string {
  const parsed = parseLectureFeeType(code)
  return parsed ? LECTURE_FEE_TYPE_LABELS[parsed] : MISSING
}

/** PER_HOUR는 레거시 저장값. 시급 비례가 아니므로 차시당으로 표시한다. */
export function instructorFeeUnitDisplayLabel(
  unit: InstructorFeeCalculationUnit | null | undefined
): string {
  if (unit === 'PER_HOUR' || unit === 'PER_CLASS') return '차시당'
  if (unit === 'PER_SESSION' || unit === 'PER_LECTURE') return '출강 1회당'
  return ''
}

export function formatLectureFeeWon(amount: number | null | undefined): string {
  if (amount == null || !Number.isSafeInteger(amount)) return MISSING
  return `${amount.toLocaleString('ko-KR')}원`
}

export function hasConfirmedLectureFeeTotal(
  preview: LectureFeePreview | null | undefined
): boolean {
  return preview?.totalLectureFee != null && Number.isSafeInteger(preview.totalLectureFee)
}

/** 지급조서 확인 '총 강사비'. 서버 실적 확정 totalLectureFee만. 시급×분/60·차시 곱셈 금지. */
export function formatTotalLectureFee(preview: LectureFeePreview | null | undefined): string {
  if (!hasConfirmedLectureFeeTotal(preview)) return MISSING
  return formatLectureFeeWon(preview?.totalLectureFee)
}

export function lectureFeeSettlementBlockerMessage(
  preview: LectureFeePreview | null | undefined
): string | null {
  const code = preview?.settlementBlockerCode
  if (!code) return null
  return LECTURE_FEE_SETTLEMENT_BLOCKER_MESSAGE[code]
}

export function isLectureFeeSettlementBlocked(
  preview: LectureFeePreview | null | undefined
): boolean {
  return preview?.settlementBlockerCode != null
}

export function formatRecognizedSessionCountLabel(count: number | null | undefined): string | null {
  if (count == null || !Number.isSafeInteger(count) || count < 0) return null
  return `인정 ${count}차시`
}

export function formatInstructorFeeAssignment(
  preview: LectureFeePreview | null | undefined
): string {
  if (!preview) return MISSING
  const unitLabel = instructorFeeUnitDisplayLabel(preview.instructorFeeCalculationUnit)
  const amountLabel =
    preview.instructorFeeAmount == null ? '' : formatLectureFeeWon(preview.instructorFeeAmount)
  if (preview.instructorFeeCalculationUnit === 'FIXED') return amountLabel || MISSING
  if (unitLabel && amountLabel) return `${unitLabel} ${amountLabel}`
  return unitLabel || amountLabel || MISSING
}

function formatSeoulClock(iso: string | null | undefined): string {
  const trimmed = iso?.trim()
  if (!trimmed) return ''
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hour = parts.find(part => part.type === 'hour')?.value
  const minute = parts.find(part => part.type === 'minute')?.value
  if (!hour || !minute) return ''
  return `${hour}:${minute}`
}

/** 교육 진행 회차 라벨. educationSessionCount는 일정 sessionNo이며 인정 차시·총액 배율이 아니다. */
export function formatLectureFeeSessionProgress(input: {
  sessionNo?: number | null
  educationSessionCount?: number | null
  startAt?: string | null
  endAt?: string | null
}): string {
  const sessionNo =
    typeof input.sessionNo === 'number' &&
    Number.isSafeInteger(input.sessionNo) &&
    input.sessionNo > 0
      ? input.sessionNo
      : typeof input.educationSessionCount === 'number' &&
          Number.isSafeInteger(input.educationSessionCount) &&
          input.educationSessionCount > 0
        ? input.educationSessionCount
        : null
  const sessionLabel = sessionNo != null ? `${sessionNo}회차` : ''
  const start = formatSeoulClock(input.startAt)
  const end = formatSeoulClock(input.endAt)
  const time = start && end ? `${start} ~ ${end}` : start || end
  const joined = [sessionLabel, time].filter(Boolean).join(', ')
  return joined || MISSING
}
