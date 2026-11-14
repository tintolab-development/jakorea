/**
 * 지급조서(발급용) 「구분」열 — BE settlement item / basisDetail SSOT.
 * kind별 고정 문구(예: 강사비 → 항상 `3급`)를 두지 않는다.
 */

import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementLine,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  GEMINI_LECTURE_FEE_TITLE,
  SPECIAL_LECTURE_FEE_TITLE,
  isGenericLectureFeeCategoryLabel,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import {
  INSTRUCTOR_FEE_GRADE_LABELS,
  toInstructorFeeGradeCode,
  type InstructorFeeGradeCode,
} from '@/shared/constants/instructor-fee-grade'

function presentText(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return ''
  return trimmed
}

/** `GRADE_1` / `1급 강사비` / `1급` → `1급` */
export function shortInstructorFeeGradeLabel(raw: string | null | undefined): string | undefined {
  const code = toInstructorFeeGradeCode(raw)
  if (!code) return undefined
  return gradeCodeToShortLabel(code)
}

function gradeCodeToShortLabel(code: InstructorFeeGradeCode): string {
  return INSTRUCTOR_FEE_GRADE_LABELS[code].replace(/\s*강사비$/u, '')
}

function lectureFeeCategoryFromLine(line: PaymentOrderCalculationStatementLine): string {
  const detail = line.basisDetail
  if (detail?.layout === 'lectureFeeTier') {
    const fromCategory = shortInstructorFeeGradeLabel(detail.categoryLabel)
    if (fromCategory) return fromCategory
    if (detail.tier === '1' || detail.tier === '2' || detail.tier === '3') {
      return `${detail.tier}급`
    }
  }
  if (detail?.layout === 'lectureFeeSpecial') {
    return presentText(detail.categoryLabel) || SPECIAL_LECTURE_FEE_TITLE
  }
  if (detail?.layout === 'lectureFeeGemini') {
    return presentText(detail.categoryLabel) || GEMINI_LECTURE_FEE_TITLE
  }
  if (detail && 'categoryLabel' in detail) {
    const label = presentText(detail.categoryLabel)
    if (label && !isGenericLectureFeeCategoryLabel(label)) {
      return shortInstructorFeeGradeLabel(label) ?? label
    }
  }

  const fromDescription = shortInstructorFeeGradeLabel(line.description)
  if (fromDescription) return fromDescription

  const description = presentText(line.description)
  if (description && !isGenericLectureFeeCategoryLabel(description)) return description

  return '-'
}

function categoryFromBasisDetail(line: PaymentOrderCalculationStatementLine): string | undefined {
  const detail = line.basisDetail
  if (!detail) return undefined

  if (detail.layout === 'transportRoundTrip') return '왕복'
  if (detail.layout === 'transportOneWay') return '편도'
  if (detail.layout === 'transportInstructor') {
    return presentText(detail.categoryLabel) || '교통비(1사1교)'
  }
  if (detail.layout === 'lodging1s1g') {
    return presentText(detail.categoryLabel) || '숙박비(1사1교)'
  }
  if (detail.layout === 'lodgingGeneral') {
    return presentText(detail.categoryLabel) || '숙박비(일반)'
  }
  if (detail.layout === 'meal') {
    return presentText(detail.categoryLabel) || '식사비'
  }
  if (detail.layout === 'activity') {
    return presentText(detail.categoryLabel) || '활동비'
  }
  if (detail.layout === 'withholding' || detail.layout === 'withholdingRate') {
    return undefined
  }
  if (detail.layout === 'remote') {
    return presentText(detail.title) || undefined
  }
  if ('categoryLabel' in detail) {
    const label = presentText(detail.categoryLabel)
    if (label) return label
  }
  return undefined
}

const KIND_FALLBACK_WHEN_NO_API: Partial<Record<PaymentOrderCalculationLineKind, string>> = {
  travel: '교통비',
  lodging: '숙박비',
  meal: '식사비',
  activity: '활동비',
  other: '기타',
}

/**
 * 발급용 산출 내역 「구분」셀.
 * 강사비 등급은 settlement `feeGrade` / item description / basisDetail.categoryLabel에서만 파생한다.
 */
export function resolvePaymentStatementIssuanceCategoryLabel(
  line: PaymentOrderCalculationStatementLine
): string {
  if (line.kind === 'lecture_fee') {
    return lectureFeeCategoryFromLine(line)
  }

  if (line.kind === 'withholding') {
    // BE taxIncomeTypeDisplay만 SSOT. kind로 기타소득 등 하드코딩 금지.
    return presentText(line.taxIncomeTypeDisplay ?? undefined) || '-'
  }

  // 비과세 교통·숙박 등: taxIncomeTypeDisplay(일용근로소득)를 구분으로 쓰지 않는다.
  if (line.taxIncomeTypeDisplay === '비과세') {
    return '비과세'
  }

  const fromDetail = categoryFromBasisDetail(line)
  if (fromDetail) return fromDetail

  const description = presentText(line.description)
  if (description && description !== line.itemLabel) return description

  return KIND_FALLBACK_WHEN_NO_API[line.kind] ?? '-'
}
