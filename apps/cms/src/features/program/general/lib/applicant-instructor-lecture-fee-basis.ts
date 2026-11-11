import type {
  ApplicantInstructorLectureFeeBasisType,
  ApplicantInstructorRow,
} from '@/features/program/shared/model/applicant-instructor'
import type { InstructorApplicationFeePolicyRequest } from '@/features/program/general/api/applications-api-client'
import {
  INSTRUCTOR_FEE_GRADE_LABELS,
  toInstructorFeeGradeCode,
  type InstructorFeeGradeCode,
} from '@/shared/constants/instructor-fee-grade'
import { formatCurrencyInput, sanitizeNumericInput } from '@/shared/lib/numeric-input'
import { parseWageGradeAmount, pricingByWageGrade } from '@/features/program/general/lib/wage-display'

export type { ApplicantInstructorLectureFeeBasisType } from '@/features/program/shared/model/applicant-instructor'

export type ApplicantInstructorBusinessIncomeStatus = '해당' | '해당 없음'

export const LECTURE_FEE_BASIS_TYPE_OPTIONS: {
  value: ApplicantInstructorLectureFeeBasisType
  label: string
}[] = [
  { value: 'program', label: '프로그램 기준' },
  { value: 'special_lecture', label: '특강 강사비' },
  { value: 'other_labor', label: '기타 인건비' },
]

/** 지급 기준 값 — `출강 1회당` = API PER_LECTURE (기본값). PER_SESSION은 기존 데이터 읽기 전용 */
export const DEFAULT_LECTURE_FEE_MEASURE = '출강 1회당'

/** 지급 기준 값 — `1시간 당` = API PER_HOUR. BE: 레거시 PER_HOUR는 시급 비례가 아니라 차시당 단가 */
export const PER_HOUR_LECTURE_FEE_MEASURE = '1시간 당'

/**
 * 특강 강사비·기타 인건비 선택 시 지급 기준 옵션 — 모든 프로그램 유형 공통 「차시당 / 출강 1회당」
 * (기획 11/10, CMS-FUNC-0076·0473·0474). 값은 API 매핑(PER_HOUR·PER_LECTURE)에 쓰이므로 그대로 두고 라벨만 정한다.
 */
export const LECTURE_FEE_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: PER_HOUR_LECTURE_FEE_MEASURE, label: '차시당' },
  { value: DEFAULT_LECTURE_FEE_MEASURE, label: '출강 1회당' },
]

/**
 * 예전 라벨·값 표기 → 지급 기준 값. 이전 화면이 저장·표시하던 「1회 기준 / 1시간 기준」「1회당 / 1시간당」도
 * 새 라벨로 읽히게 한다.
 */
const LECTURE_FEE_MEASURE_VALUE_BY_TEXT: Readonly<Record<string, string>> = {
  [DEFAULT_LECTURE_FEE_MEASURE]: DEFAULT_LECTURE_FEE_MEASURE,
  '1회 기준': DEFAULT_LECTURE_FEE_MEASURE,
  '1회당': DEFAULT_LECTURE_FEE_MEASURE,
  [PER_HOUR_LECTURE_FEE_MEASURE]: PER_HOUR_LECTURE_FEE_MEASURE,
  '1시간당': PER_HOUR_LECTURE_FEE_MEASURE,
  '1시간 기준': PER_HOUR_LECTURE_FEE_MEASURE,
  차시당: PER_HOUR_LECTURE_FEE_MEASURE,
}

/** 지급 기준 표기(값·새 라벨·예전 라벨) → 값. 모르는 표기면 undefined */
export function resolveLectureFeeMeasureValue(raw: string | null | undefined): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  return LECTURE_FEE_MEASURE_VALUE_BY_TEXT[trimmed]
}

/** 지급 기준 값(또는 예전 표기) → 화면 라벨 「차시당 / 출강 1회당」. 모르면 빈 문자열 */
export function lectureFeeMeasureLabel(raw: string | null | undefined): string {
  const value = resolveLectureFeeMeasureValue(raw)
  return value ? (LECTURE_FEE_MEASURE_OPTIONS.find(option => option.value === value)?.label ?? '') : ''
}

/** 프로그램 기준 선택 시 지급 기준 셀렉트 고정 표시 */
export const LECTURE_FEE_MEASURE_NOT_APPLICABLE = '해당 없음'

export const LECTURE_FEE_MEASURE_NOT_APPLICABLE_OPTION = {
  value: LECTURE_FEE_MEASURE_NOT_APPLICABLE,
  label: LECTURE_FEE_MEASURE_NOT_APPLICABLE,
} as const

/** @deprecated LECTURE_FEE_MEASURE_OPTIONS 와 동일 — 승인 모달 등 기존 import 호환 */
export const LECTURE_FEE_PAYMENT_CRITERIA_OPTIONS = LECTURE_FEE_MEASURE_OPTIONS

/** @deprecated DEFAULT_LECTURE_FEE_MEASURE 사용 */
export const DEFAULT_LECTURE_FEE_PAYMENT_CRITERIA = DEFAULT_LECTURE_FEE_MEASURE

/** 강사비 책정 승인 모달 — 라디오 라벨(「적용」 접미사) */
export const INSTRUCTOR_FEE_APPROVAL_BASIS_OPTIONS: {
  value: ApplicantInstructorLectureFeeBasisType
  label: string
}[] = [
  { value: 'program', label: '프로그램 기준 적용' },
  { value: 'special_lecture', label: '특강 강사비 적용' },
  { value: 'other_labor', label: '기타 인건비 적용' },
]

const LECTURE_FEE_BASIS_TYPE_LABEL: Record<ApplicantInstructorLectureFeeBasisType, string> = {
  program: '프로그램 기준',
  special_lecture: '특강 강사비',
  other_labor: '기타 인건비',
}

export function lectureFeeBasisTypeLabel(type: ApplicantInstructorLectureFeeBasisType): string {
  return LECTURE_FEE_BASIS_TYPE_LABEL[type]
}

/** GET `feePolicy.basisType` — `PROGRAM`/`program`은 프로그램 기준. RECRUITMENT만 특강. */
export function parseLectureFeeBasisTypeFromApi(
  raw?: string | null
): ApplicantInstructorLectureFeeBasisType | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  const upper = trimmed.toUpperCase()
  const lower = trimmed.toLowerCase()
  if (upper === 'PROGRAM' || lower === 'program' || /프로그램\s*기준/.test(trimmed)) {
    return 'program'
  }
  if (lower === 'special_lecture' || /특강/.test(trimmed)) return 'special_lecture'
  if (lower === 'other_labor' || /기타\s*인건비/.test(trimmed)) return 'other_labor'
  if (upper === 'RECRUITMENT') return 'special_lecture'
  return undefined
}

export function parseBusinessIncomeStatus(
  value: string | null | undefined
): ApplicantInstructorBusinessIncomeStatus | undefined {
  const trimmed = value?.trim()
  if (trimmed === '해당' || trimmed === '해당 없음') return trimmed
  return undefined
}

/**
 * 강사 신청 PATCH `businessIncomeEarnerStatus` 필드.
 * 표시값(신청값 또는 회원 프로필 fallback)에서 바뀌지 않았으면 필드를 생략해 기존 신청값을 유지한다.
 * 바뀌지 않은 fallback 값을 보내면 신청 override로 저장되므로 보내지 않는다.
 */
export function businessIncomeEarnerStatusPatchField(
  current: string | null | undefined,
  nextRaw: string | null | undefined
): { businessIncomeEarnerStatus?: ApplicantInstructorBusinessIncomeStatus } {
  const next = parseBusinessIncomeStatus(nextRaw)
  if (next == null) return {}
  if (parseBusinessIncomeStatus(current) === next) return {}
  return { businessIncomeEarnerStatus: next }
}

export function parseLectureFeeAmountDigits(raw: string | undefined): string {
  return sanitizeNumericInput(raw ?? '', { mode: 'currency' })
}

export function formatLectureFeeAmountWon(amountDigits: string | undefined): string {
  const digits = parseLectureFeeAmountDigits(amountDigits)
  if (!digits) return ''
  return `${formatCurrencyInput(digits.replace(/^0+(?=\d)/, ''))}원`
}

export function formatLectureFeeAmountInput(amountDigits: string | undefined): string {
  const digits = parseLectureFeeAmountDigits(amountDigits)
  return formatCurrencyInput(digits)
}

function inferLectureFeeBasisTypeFromDisplay(
  display: string
): ApplicantInstructorLectureFeeBasisType | null {
  const t = display.trim()
  if (!t) return null
  if (/프로그램\s*기준/.test(t)) return 'program'
  if (/특강/.test(t)) return 'special_lecture'
  if (/기타\s*인건비/.test(t)) return 'other_labor'
  return null
}

function findLectureFeeMeasureInDisplaySegments(segments: string[]): string | undefined {
  return segments.find(s => resolveLectureFeeMeasureValue(s) != null)
}

export function normalizeLectureFeeMeasure(
  measure: string | undefined,
  type?: ApplicantInstructorLectureFeeBasisType
): string {
  if (type === 'program') {
    return LECTURE_FEE_MEASURE_NOT_APPLICABLE
  }
  return resolveLectureFeeMeasureValue(measure) ?? DEFAULT_LECTURE_FEE_MEASURE
}

/** 승인 POST·상세 PATCH 공통 `feePolicy` — `measure`에 정산 계산 단위(`SESSION`)를 보내면 422 */
export const INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE = '강사비 기준을 확인해 주세요.'

export type InstructorApplicationFeePolicyContext = {
  programWageGradeRows?: Array<{ grade: string; pricing: string }>
}

export type ApiInstructorFeePolicyBasisType = 'PROGRAM' | 'RECRUITMENT'
/** 출강 1회당은 PER_LECTURE로 보낸다. PER_SESSION은 기존 데이터 읽기 전용(백엔드가 신규 입력을 거절). */
export type ApiInstructorFeePolicyMeasure = 'PER_LECTURE' | 'PER_HOUR' | 'FIXED'

export function toApiInstructorFeePolicyBasisType(
  basisType: ApplicantInstructorLectureFeeBasisType
): ApiInstructorFeePolicyBasisType {
  return basisType === 'program' ? 'PROGRAM' : 'RECRUITMENT'
}

export function toApiInstructorFeePolicyMeasure(
  uiMeasure: string | null | undefined,
  basisType: ApplicantInstructorLectureFeeBasisType,
  programCalculationUnit?: string | null
): ApiInstructorFeePolicyMeasure {
  if (basisType === 'program') {
    const unit = (programCalculationUnit ?? 'PER_HOUR').trim().toUpperCase()
    if (unit === 'PER_SESSION' || unit === 'SESSION' || unit === 'PER_LECTURE') return 'PER_LECTURE'
    if (unit === 'FIXED') return 'FIXED'
    return 'PER_HOUR'
  }

  const normalized = normalizeLectureFeeMeasure(uiMeasure ?? undefined, basisType)
  const upper = normalized.trim().toUpperCase()
  if (upper === 'PER_SESSION' || upper === 'SESSION' || upper === 'PER_LECTURE') return 'PER_LECTURE'
  if (upper === 'PER_HOUR' || upper === 'HOUR') return 'PER_HOUR'
  if (upper === 'FIXED') return 'FIXED'
  if (normalized === DEFAULT_LECTURE_FEE_MEASURE) return 'PER_LECTURE'
  if (normalized === PER_HOUR_LECTURE_FEE_MEASURE) return 'PER_HOUR'
  return 'PER_LECTURE'
}

export function resolveInstructorFeeGradeCode(
  raw: string | null | undefined
): InstructorFeeGradeCode | undefined {
  return toInstructorFeeGradeCode(raw)
}

export function resolveProgramBasisFeePolicyFromWageRows(
  instructorFeeGradeRaw: string,
  programWageGradeRows?: Array<{ grade: string; pricing: string }>
): { amount: number; measure: ApiInstructorFeePolicyMeasure } | null {
  const code = resolveInstructorFeeGradeCode(instructorFeeGradeRaw)
  if (!code || !programWageGradeRows?.length) return null

  const label = INSTRUCTOR_FEE_GRADE_LABELS[code]
  const pricing = pricingByWageGrade(programWageGradeRows)[label]
  const amount = parseWageGradeAmount(pricing)
  if (amount == null || amount < 0) return null

  const measure = /1시간/.test(pricing ?? '') ? 'PER_HOUR' : 'PER_LECTURE'
  return { amount, measure }
}

export function isInstructorApplicationFeePolicyRequestValid(
  policy: InstructorApplicationFeePolicyRequest | null | undefined,
  assignmentCount = 1
): boolean {
  if (!policy || assignmentCount < 1) return false
  const basisType = policy.basisType.trim()
  const measure = policy.measure.trim()
  const grade = policy.instructorFeeGrade.trim()
  if (!basisType || !measure || !grade) return false
  if (!resolveInstructorFeeGradeCode(grade)) return false
  if (!Number.isFinite(policy.amount) || policy.amount < 0) return false
  return true
}

export function toInstructorApplicationFeePolicy(
  input: {
    basisType: ApplicantInstructorLectureFeeBasisType | undefined
    measure: string | null | undefined
    amount: string | null | undefined
    instructorFeeGrade: string | null | undefined
  },
  context?: InstructorApplicationFeePolicyContext
): InstructorApplicationFeePolicyRequest | null {
  const basisTypeUi = input.basisType ?? 'special_lecture'
  const gradeCode = resolveInstructorFeeGradeCode(input.instructorFeeGrade)
  if (!gradeCode) return null

  let amount: number
  let measure: ApiInstructorFeePolicyMeasure

  if (basisTypeUi === 'program') {
    const fromProgram = resolveProgramBasisFeePolicyFromWageRows(
      input.instructorFeeGrade ?? '',
      context?.programWageGradeRows
    )
    if (!fromProgram) return null
    amount = fromProgram.amount
    measure = fromProgram.measure
  } else {
    amount = Number(parseLectureFeeAmountDigits(input.amount ?? undefined) || 0)
    if (!Number.isFinite(amount) || amount < 0) return null
    measure = toApiInstructorFeePolicyMeasure(input.measure, basisTypeUi)
  }

  return {
    basisType: toApiInstructorFeePolicyBasisType(basisTypeUi),
    measure,
    amount,
    instructorFeeGrade: gradeCode,
  }
}

export interface ResolvedLectureFeeBasis {
  type: ApplicantInstructorLectureFeeBasisType
  measure: string
  amount: string
}

export function resolveLectureFeeBasisFromRow(row: ApplicantInstructorRow): ResolvedLectureFeeBasis {
  if (row.lectureFeeBasisType) {
    return {
      type: row.lectureFeeBasisType,
      measure: normalizeLectureFeeMeasure(row.lectureFeeMeasure, row.lectureFeeBasisType),
      amount: parseLectureFeeAmountDigits(row.lectureFeeAmount),
    }
  }

  const display = row.lectureFeeBasisDisplay?.trim()
  if (!display) {
    return {
      type: 'program',
      measure: LECTURE_FEE_MEASURE_NOT_APPLICABLE,
      amount: parseLectureFeeAmountDigits(row.lectureFeeAmount),
    }
  }

  const inferredType = inferLectureFeeBasisTypeFromDisplay(display)
  if (inferredType === 'program') {
    const segments = display.split('|').map(s => s.trim()).filter(Boolean)
    const amountSegment = segments.find(s => /[\d,]+/.test(s))
    return {
      type: 'program',
      measure: LECTURE_FEE_MEASURE_NOT_APPLICABLE,
      amount: parseLectureFeeAmountDigits(amountSegment),
    }
  }

  const segments = display.split('|').map(s => s.trim()).filter(Boolean)
  const type =
    inferredType ??
    (segments[0]?.includes('특강')
      ? 'special_lecture'
      : segments[0]?.includes('기타')
        ? 'other_labor'
        : 'program')

  // 「출강 1회당」의 1을 금액으로 읽지 않는다
  const amountSegment =
    segments.find(s => /[\d,]+/.test(s) && resolveLectureFeeMeasureValue(s) == null) ??
    segments[segments.length - 1]
  const measureSegment = findLectureFeeMeasureInDisplaySegments(segments)

  return {
    type,
    measure: normalizeLectureFeeMeasure(measureSegment),
    amount: parseLectureFeeAmountDigits(amountSegment),
  }
}

/**
 * 상세·정산 보기용 세그먼트: 유형 | 지급 기준 | 금액. 값 없으면 [].
 * 지급 기준은 공통 라벨 「차시당 / 출강 1회당」으로 보인다(예전 라벨로 저장된 값 포함).
 */
export function buildLectureFeeBasisViewSegments(row: ApplicantInstructorRow): string[] {
  const hasExplicitBasis =
    Boolean(row.lectureFeeBasisType) ||
    Boolean(row.lectureFeeBasisDisplay?.trim()) ||
    Boolean(parseLectureFeeAmountDigits(row.lectureFeeAmount))
  if (!hasExplicitBasis) return []

  const fee = resolveLectureFeeBasisFromRow(row)
  const measureLabel = lectureFeeMeasureLabel(row.lectureFeeMeasure || fee.measure)
  return [
    lectureFeeBasisTypeLabel(fee.type),
    measureLabel,
    formatLectureFeeAmountWon(fee.amount),
  ].filter(Boolean)
}

/**
 * 일반(기관형) 강사 신청 상세 — 승인 상태 「강사비 책정 기준」 조회 세그먼트.
 * - 프로그램 기준(시안 06-1, 1141:244079): `프로그램 기준 | 3급 강사비 : 차시당 240,000원`(지급 기준 라벨 공통화, 기획 11/10)
 * - 특강 강사비(시안 06-2, 1141:243841): `특강 강사비 | 출강 1회당 150,000원`
 * - 기타 인건비: 시안 없음 — 특강과 같은 규칙 `기타 인건비 | 출강 1회당 N원`
 * 값이 빠지면 있는 값만 이어 붙인다. 값이 하나도 없으면 [].
 */
export function buildGeneralOrganizationLectureFeeBasisViewSegments(
  row: ApplicantInstructorRow
): string[] {
  const hasExplicitBasis =
    Boolean(row.lectureFeeBasisType) ||
    Boolean(row.lectureFeeBasisDisplay?.trim()) ||
    Boolean(parseLectureFeeAmountDigits(row.lectureFeeAmount))
  if (!hasExplicitBasis) return []

  const fee = resolveLectureFeeBasisFromRow(row)
  // 지급 기준 라벨은 모든 유형 공통 「차시당 / 출강 1회당」
  const measureLabel = lectureFeeMeasureLabel(row.lectureFeeMeasure || fee.measure)
  const amountLabel = formatLectureFeeAmountWon(fee.amount)
  const priceLabel = [measureLabel, amountLabel].filter(Boolean).join(' ')

  if (fee.type === 'program') {
    const grade = row.instructorFeeGradeLabel?.trim() ?? ''
    const detail = grade && priceLabel ? `${grade} : ${priceLabel}` : grade || priceLabel
    return [lectureFeeBasisTypeLabel(fee.type), detail].filter(Boolean)
  }
  return [lectureFeeBasisTypeLabel(fee.type), priceLabel].filter(Boolean)
}

export function buildLectureFeeBasisDisplay(
  type: ApplicantInstructorLectureFeeBasisType,
  measure: string,
  amountDigits: string
): string | undefined {
  if (type === 'program') {
    const amountLabel = formatLectureFeeAmountWon(amountDigits)
    if (!amountLabel) {
      return lectureFeeBasisTypeLabel(type)
    }
    return `${lectureFeeBasisTypeLabel(type)} | ${amountLabel}`
  }
  const amountLabel = formatLectureFeeAmountWon(amountDigits)
  if (!amountLabel) {
    return lectureFeeBasisTypeLabel(type)
  }
  // 저장·표시 문자열도 공통 라벨로 — 다시 읽을 때 resolveLectureFeeMeasureValue가 값으로 되돌린다
  const measureLabel = lectureFeeMeasureLabel(measure) || measure.trim()
  if (measureLabel) {
    return `${lectureFeeBasisTypeLabel(type)} | ${measureLabel} | ${amountLabel}`
  }
  return `${lectureFeeBasisTypeLabel(type)} | ${amountLabel}`
}
