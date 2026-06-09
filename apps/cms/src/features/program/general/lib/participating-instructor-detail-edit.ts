import { z } from 'zod'
import type { ApplicantInstructorLectureFeeBasisType } from '@/data/mock/applicant-instructors'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import {
  buildLectureFeeBasisDisplay,
  formatLectureFeeAmountWon,
  lectureFeeBasisTypeLabel,
  parseBusinessIncomeStatus,
  parseLectureFeeAmountDigits,
  LECTURE_FEE_MEASURE_OPTIONS,
  type ApplicantInstructorBusinessIncomeStatus,
  type ResolvedLectureFeeBasis,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

export interface ParticipatingInstructorEditDraft {
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure: string
  lectureFeeAmount: string
  instructorFeeGrade: string
  businessIncomeEarnerStatus: ApplicantInstructorBusinessIncomeStatus
}

export interface ParticipatingInstructorDetailSavePayload {
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure?: string
  lectureFeeAmount?: string
  lectureFeeBasisDisplay?: string
  lectureFeeCategory?: string
  instructorFeeGradeLabel?: string
  businessIncomeEarnerStatus: ApplicantInstructorBusinessIncomeStatus
}

export const participatingInstructorEditSchema = z
  .object({
    lectureFeeBasisType: z.enum(['program', 'special_lecture', 'other_labor']),
    lectureFeeMeasure: z.string(),
    lectureFeeAmount: z.string(),
    instructorFeeGrade: z.string().trim().min(1, '강사비 등급을 선택해주세요.'),
    businessIncomeEarnerStatus: z.enum(['해당', '해당 없음']),
  })
  .superRefine((data, ctx) => {
    if (data.lectureFeeBasisType === 'program') return
    if (parseLectureFeeAmountDigits(data.lectureFeeAmount)) return
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lectureFeeAmount'],
      message: '금액을 입력해주세요.',
    })
  })

export type ParticipatingInstructorEditFormValues = z.infer<typeof participatingInstructorEditSchema>

function inferLectureFeeBasisTypeFromCategory(
  category: string
): ApplicantInstructorLectureFeeBasisType | null {
  const t = category.trim()
  if (!t) return null
  if (/프로그램\s*기준/.test(t)) return 'program'
  if (/특강/.test(t)) return 'special_lecture'
  if (/기타\s*인건비/.test(t)) return 'other_labor'
  return null
}

export function resolveLectureFeeBasisFromParticipatingRow(
  row: ParticipatingInstructorRow
): ResolvedLectureFeeBasis {
  if (row.lectureFeeBasisType) {
    return {
      type: row.lectureFeeBasisType,
      measure: row.lectureFeeMeasure?.trim() || LECTURE_FEE_MEASURE_OPTIONS[0]!.value,
      amount: parseLectureFeeAmountDigits(row.lectureFeeAmount),
    }
  }

  const display = row.lectureFeeBasisDisplay?.trim()
  if (display) {
    const inferred = inferLectureFeeBasisTypeFromCategory(display)
    if (inferred === 'program') {
      return {
        type: 'program',
        measure: LECTURE_FEE_MEASURE_OPTIONS[0]!.value,
        amount: '',
      }
    }

    const segments = display.split('|').map(s => s.trim()).filter(Boolean)
    const type =
      inferred ??
      (segments[0]?.includes('특강')
        ? 'special_lecture'
        : segments[0]?.includes('기타')
          ? 'other_labor'
          : 'special_lecture')
    const amountSegment = segments.find(s => /[\d,]+/.test(s)) ?? segments[segments.length - 1]
    const measureSegment = segments.find(s => /기준/.test(s))

    return {
      type,
      measure: measureSegment ?? LECTURE_FEE_MEASURE_OPTIONS[0]!.value,
      amount: parseLectureFeeAmountDigits(amountSegment ?? row.lectureFeeAmount),
    }
  }

  const category = row.lectureFeeCategory?.trim() ?? ''
  const inferred = inferLectureFeeBasisTypeFromCategory(category)
  if (inferred === 'program') {
    return {
      type: 'program',
      measure: LECTURE_FEE_MEASURE_OPTIONS[0]!.value,
      amount: '',
    }
  }

  return {
    type: inferred ?? 'special_lecture',
    measure: LECTURE_FEE_MEASURE_OPTIONS[0]!.value,
    amount: parseLectureFeeAmountDigits(row.lectureFeeAmount) || '915000',
  }
}

export function rowToParticipatingInstructorEditDraft(
  row: ParticipatingInstructorRow
): ParticipatingInstructorEditDraft {
  const fee = resolveLectureFeeBasisFromParticipatingRow(row)
  return {
    lectureFeeBasisType: fee.type,
    lectureFeeMeasure: fee.measure,
    lectureFeeAmount: fee.amount,
    instructorFeeGrade: row.instructorFeeGradeLabel?.trim() ?? '',
    businessIncomeEarnerStatus: parseBusinessIncomeStatus(row.businessIncomeEarnerStatus),
  }
}

export function draftToParticipatingInstructorSavePayload(
  draft: ParticipatingInstructorEditDraft
): ParticipatingInstructorDetailSavePayload {
  const parsed = participatingInstructorEditSchema.parse(draft)
  const amountDigits = parseLectureFeeAmountDigits(parsed.lectureFeeAmount)
  const instructorFeeGrade = parsed.instructorFeeGrade.trim()
  const lectureFeeBasisDisplay = buildLectureFeeBasisDisplay(
    parsed.lectureFeeBasisType,
    parsed.lectureFeeMeasure,
    amountDigits
  )

  return {
    lectureFeeBasisType: parsed.lectureFeeBasisType,
    lectureFeeMeasure:
      parsed.lectureFeeBasisType === 'program'
        ? undefined
        : parsed.lectureFeeMeasure.trim() || undefined,
    lectureFeeAmount:
      parsed.lectureFeeBasisType === 'program' ? undefined : amountDigits || undefined,
    lectureFeeBasisDisplay,
    lectureFeeCategory: lectureFeeBasisTypeLabel(parsed.lectureFeeBasisType),
    instructorFeeGradeLabel: instructorFeeGrade || undefined,
    businessIncomeEarnerStatus: parsed.businessIncomeEarnerStatus,
  }
}

export function parseParticipatingInstructorEditDraft(
  draft: ParticipatingInstructorEditDraft
):
  | { success: true; data: ParticipatingInstructorEditFormValues }
  | { success: false; errors: Record<string, string> } {
  const result = participatingInstructorEditSchema.safeParse(draft)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }
  return { success: false, errors }
}

/** 강의비·등급 뷰 컴포넌트(`ApplicantInstructorRow`) 재사용용 어댑터 */
export function participatingRowToApplicantFeeViewRow(
  row: ParticipatingInstructorRow
): {
  lectureFeeBasisType?: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure?: string
  lectureFeeAmount?: string
  lectureFeeBasisDisplay?: string
  instructorFeeGradeLabel?: string
  businessIncomeEarnerStatus?: string
} {
  const fee = resolveLectureFeeBasisFromParticipatingRow(row)
  return {
    lectureFeeBasisType: fee.type,
    lectureFeeMeasure: fee.measure,
    lectureFeeAmount: fee.amount,
    lectureFeeBasisDisplay:
      row.lectureFeeBasisDisplay?.trim() ||
      buildLectureFeeBasisDisplay(fee.type, fee.measure, fee.amount),
    instructorFeeGradeLabel: row.instructorFeeGradeLabel,
    businessIncomeEarnerStatus: row.businessIncomeEarnerStatus,
  }
}

export function formatParticipatingLectureFeeAmountDisplay(amountDigits: string | undefined): string {
  return formatLectureFeeAmountWon(amountDigits)
}
