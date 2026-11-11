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
  'SETTLEMENT_ASSIGNED_SCHEDULE_TIME_REQUIRED',
  'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED',
  'SETTLEMENT_WAGE_RATE_NOT_CONFIGURED',
  'SETTLEMENT_LONG_DISTANCE_FEE_NOT_CONFIGURED',
] as const

/** 배정에 저장된 강사비 책정 방식. 제미나이는 null */
export const FEE_PRICING_MODES = ['PROGRAM_STANDARD', 'SPECIAL_LECTURE', 'OTHER_LABOR'] as const
export type FeePricingMode = (typeof FEE_PRICING_MODES)[number]
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
  /** 강사비 책정 방식. 특강·기타 인건비면 lectureFeeType은 null이고 instructorFeeAmount가 승인 금액이다 */
  feePricingMode?: FeePricingMode | null
  /** 화면용 강사비 이름: "1급 강사비" | "특강 강사비" | "기타 인건비" (지급조서 강사비 항목 이름과 같다) */
  wageTitle?: string | null
  /** 1사1교 장거리 단가 적용 시 true */
  longDistance?: boolean | null
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
  SETTLEMENT_ASSIGNED_SCHEDULE_TIME_REQUIRED:
    '배정된 강의 시간이 없어 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
  SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED:
    '강의 실적 시간이 없어 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
  SETTLEMENT_WAGE_RATE_NOT_CONFIGURED:
    '강사비 단가가 설정되지 않아 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
  SETTLEMENT_LONG_DISTANCE_FEE_NOT_CONFIGURED:
    '장거리 강사비 단가가 설정되지 않아 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
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

function parseFeePricingMode(value: unknown): FeePricingMode | null {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return (FEE_PRICING_MODES as readonly string[]).includes(raw) ? (raw as FeePricingMode) : null
}

function parseOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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
    feePricingMode: parseFeePricingMode(value.feePricingMode),
    wageTitle: parseOptionalText(value.wageTitle),
    longDistance: typeof value.longDistance === 'boolean' ? value.longDistance : null,
  }
}

export function lectureFeeTypeDisplayLabel(code: string | null | undefined): string {
  const parsed = parseLectureFeeType(code)
  return parsed ? LECTURE_FEE_TYPE_LABELS[parsed] : MISSING
}

/**
 * 강사비 지급 기준 라벨 (기획 K8·B4). PER_HOUR는 레거시 저장값이라 차시당과 같다.
 * PER_SESSION·FIXED는 출강 1회당으로 표시한다.
 */
export function instructorFeeUnitDisplayLabel(
  unit: InstructorFeeCalculationUnit | null | undefined
): string {
  if (unit === 'PER_HOUR' || unit === 'PER_CLASS') return '차시당'
  if (unit === 'PER_SESSION' || unit === 'PER_LECTURE' || unit === 'FIXED') return '출강 1회당'
  return ''
}

/** 강사비 이름 — 서버 wageTitle 우선, 없으면 등급 코드 라벨 */
export function lectureFeeWageTitle(preview: LectureFeePreview | null | undefined): string {
  return preview?.wageTitle?.trim() || lectureFeeTypeDisplayLabel(preview?.lectureFeeType)
}

/**
 * 강의 상세 "강사비 책정 기준" (기획 K7, 배정 기준).
 * - 프로그램 기준: wageTitle만 (예: "1급 강사비")
 * - 특강·기타 인건비: "{wageTitle} | {단위} {금액}원" (예: "특강 강사비 | 출강 1회당 200,000원")
 */
export function formatLectureFeeBasisSummary(preview: LectureFeePreview | null | undefined): string {
  if (!preview) return MISSING
  const title = lectureFeeWageTitle(preview)
  if (preview.feePricingMode === 'SPECIAL_LECTURE' || preview.feePricingMode === 'OTHER_LABOR') {
    const unit = instructorFeeUnitDisplayLabel(preview.instructorFeeCalculationUnit)
    const amount =
      preview.instructorFeeAmount == null ? '' : formatLectureFeeWon(preview.instructorFeeAmount)
    const price = [unit, amount].filter(Boolean).join(' ')
    return [title === MISSING ? '' : title, price].filter(Boolean).join(' | ') || MISSING
  }
  return title
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
  return `${count}차시`
}

/** 지급조서 '교육 진행 차시'. recognizedSessionCount만. educationSessionCount로 대체하지 않는다. */
export function formatEducationProgressSessionCount(
  count: number | null | undefined
): string {
  return formatRecognizedSessionCountLabel(count) ?? MISSING
}

export function formatInstructorFeeAssignment(
  preview: LectureFeePreview | null | undefined
): string {
  if (!preview) return MISSING
  const unitLabel = instructorFeeUnitDisplayLabel(preview.instructorFeeCalculationUnit)
  const amountLabel =
    preview.instructorFeeAmount == null ? '' : formatLectureFeeWon(preview.instructorFeeAmount)
  // 1사1교 장거리 단가 (기획 K11): 편도 거리는 표기하지 않는다
  if (preview.longDistance === true && amountLabel) return `장거리 : ${amountLabel}`
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
