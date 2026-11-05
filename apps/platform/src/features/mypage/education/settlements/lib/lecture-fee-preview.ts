export const LECTURE_FEE_TYPE_CODES = ['GRADE_1', 'GRADE_2', 'GRADE_3'] as const
export type LectureFeeTypeCode = (typeof LECTURE_FEE_TYPE_CODES)[number]

export const INSTRUCTOR_FEE_CALCULATION_UNITS = [
  'PER_HOUR',
  'PER_SESSION',
  'PER_LECTURE',
  'FIXED',
] as const
export type InstructorFeeCalculationUnit = (typeof INSTRUCTOR_FEE_CALCULATION_UNITS)[number]

export type LectureFeePreview = {
  lectureFeeType: LectureFeeTypeCode | null
  instructorFeeCalculationUnit: InstructorFeeCalculationUnit | null
  instructorFeeAmount: number | null
  totalLectureFee: number | null
  educationSessionCount: number | null
}

const MISSING = '-'

const LECTURE_FEE_TYPE_LABELS: Record<LectureFeeTypeCode, string> = {
  GRADE_1: '1급 강의비',
  GRADE_2: '2급 강의비',
  GRADE_3: '3급 강의비',
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

export function parseLectureFeePreview(value: unknown): LectureFeePreview | null {
  if (value == null) return null
  if (!isRecord(value)) return null
  return {
    lectureFeeType: parseLectureFeeType(value.lectureFeeType),
    instructorFeeCalculationUnit: parseFeeUnit(value.instructorFeeCalculationUnit),
    instructorFeeAmount: parseNullableInteger(value.instructorFeeAmount),
    totalLectureFee: parseNullableInteger(value.totalLectureFee),
    educationSessionCount: parseNullableInteger(value.educationSessionCount),
  }
}

export function lectureFeeTypeDisplayLabel(code: string | null | undefined): string {
  const parsed = parseLectureFeeType(code)
  return parsed ? LECTURE_FEE_TYPE_LABELS[parsed] : MISSING
}

export function instructorFeeUnitDisplayLabel(
  unit: InstructorFeeCalculationUnit | null | undefined,
): string {
  if (unit === 'PER_HOUR') return '1시간 당'
  if (unit === 'PER_SESSION' || unit === 'PER_LECTURE') return '출강 1회당'
  return ''
}

export function formatLectureFeeWon(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return MISSING
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatInstructorFeeAssignment(preview: LectureFeePreview | null | undefined): string {
  if (!preview) return MISSING
  const unitLabel = instructorFeeUnitDisplayLabel(preview.instructorFeeCalculationUnit)
  const amountLabel =
    preview.instructorFeeAmount == null ? '' : formatLectureFeeWon(preview.instructorFeeAmount)
  if (preview.instructorFeeCalculationUnit === 'FIXED') return amountLabel || MISSING
  if (unitLabel && amountLabel) return `${unitLabel}, ${amountLabel}`
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

export function formatLectureFeeSessionProgress(input: {
  sessionNo?: number | null
  educationSessionCount?: number | null
  startAt?: string | null
  endAt?: string | null
}): string {
  const sessionNo =
    typeof input.sessionNo === 'number' && Number.isSafeInteger(input.sessionNo) && input.sessionNo > 0
      ? input.sessionNo
      : typeof input.educationSessionCount === 'number' &&
          Number.isSafeInteger(input.educationSessionCount) &&
          input.educationSessionCount > 0
        ? input.educationSessionCount
        : null
  const sessionLabel = sessionNo != null ? `${sessionNo}차시` : ''
  const start = formatSeoulClock(input.startAt)
  const end = formatSeoulClock(input.endAt)
  const time = start && end ? `${start} ~ ${end}` : start || end
  const joined = [sessionLabel, time].filter(Boolean).join(', ')
  return joined || MISSING
}
