import type {
  ApplicantInstructorLectureFeeBasisType,
  ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'

export type { ApplicantInstructorLectureFeeBasisType } from '@/data/mock/applicant-instructors'

export type ApplicantInstructorBusinessIncomeStatus = '해당' | '해당 없음'

export const LECTURE_FEE_BASIS_TYPE_OPTIONS: {
  value: ApplicantInstructorLectureFeeBasisType
  label: string
}[] = [
  { value: 'program', label: '프로그램 기준' },
  { value: 'special_lecture', label: '특강 강사비' },
  { value: 'other_labor', label: '기타 인건비' },
]

/** 특강 강사비·기타 인건비 선택 시 지급 기준 옵션 */
export const LECTURE_FEE_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: '출강 1회당', label: '출강 1회당' },
  { value: '1시간 당', label: '1시간 당' },
]

export const DEFAULT_LECTURE_FEE_MEASURE = LECTURE_FEE_MEASURE_OPTIONS[0]!.value

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

export function parseBusinessIncomeStatus(
  value: string | undefined
): ApplicantInstructorBusinessIncomeStatus {
  return value?.trim() === '해당' ? '해당' : '해당 없음'
}

export function parseLectureFeeAmountDigits(raw: string | undefined): string {
  return (raw ?? '').replace(/[^\d]/g, '')
}

export function formatLectureFeeAmountWon(amountDigits: string | undefined): string {
  const digits = parseLectureFeeAmountDigits(amountDigits)
  if (!digits) return ''
  return `${Number.parseInt(digits, 10).toLocaleString('ko-KR')}원`
}

export function formatLectureFeeAmountInput(amountDigits: string | undefined): string {
  const digits = parseLectureFeeAmountDigits(amountDigits)
  if (!digits) return ''
  return Number.parseInt(digits, 10).toLocaleString('ko-KR')
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
  return segments.find(
    s =>
      LECTURE_FEE_MEASURE_OPTIONS.some(option => option.value === s) ||
      s === '1회 기준'
  )
}

export function normalizeLectureFeeMeasure(
  measure: string | undefined,
  type?: ApplicantInstructorLectureFeeBasisType
): string {
  if (type === 'program') {
    return LECTURE_FEE_MEASURE_NOT_APPLICABLE
  }
  const trimmed = measure?.trim()
  if (!trimmed || trimmed === '1회 기준' || trimmed === LECTURE_FEE_MEASURE_NOT_APPLICABLE) {
    return DEFAULT_LECTURE_FEE_MEASURE
  }
  const matched = LECTURE_FEE_MEASURE_OPTIONS.find(option => option.value === trimmed)
  return matched?.value ?? DEFAULT_LECTURE_FEE_MEASURE
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
      type: 'special_lecture',
      measure: DEFAULT_LECTURE_FEE_MEASURE,
      amount: '915000',
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
        : 'special_lecture')

  const amountSegment = segments.find(s => /[\d,]+/.test(s)) ?? segments[segments.length - 1]
  const measureSegment = findLectureFeeMeasureInDisplaySegments(segments)

  return {
    type,
    measure: normalizeLectureFeeMeasure(measureSegment),
    amount: parseLectureFeeAmountDigits(amountSegment),
  }
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
  const measureLabel = measure.trim()
  if (measureLabel) {
    return `${lectureFeeBasisTypeLabel(type)} | ${measureLabel} | ${amountLabel}`
  }
  return `${lectureFeeBasisTypeLabel(type)} | ${amountLabel}`
}
