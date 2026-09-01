import { z } from 'zod'
import type {
  ApplicantInstructorDetailSavePayload,
  ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import {
  buildLectureFeeBasisDisplay,
  parseBusinessIncomeStatus,
  parseLectureFeeAmountDigits,
  resolveLectureFeeBasisFromRow,
  type ApplicantInstructorBusinessIncomeStatus,
  type ApplicantInstructorLectureFeeBasisType,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

export interface ApplicantInstructorEditDraft {
  adminComment: string
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure: string
  lectureFeeAmount: string
  instructorFeeGrade: string
  businessIncomeEarnerStatus: ApplicantInstructorBusinessIncomeStatus
}

export const applicantInstructorEditSchema = z
  .object({
    adminComment: z.string(),
    lectureFeeBasisType: z.enum(['program', 'special_lecture', 'other_labor']),
    lectureFeeMeasure: z.string(),
    lectureFeeAmount: z.string(),
    instructorFeeGrade: z.string().trim().min(1, '강사비 등급을 선택해주세요.'),
    businessIncomeEarnerStatus: z.enum(['해당', '해당 없음']),
  })
  .superRefine((data, ctx) => {
    if (parseLectureFeeAmountDigits(data.lectureFeeAmount)) return
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lectureFeeAmount'],
      message: '금액을 입력해주세요.',
    })
  })

export type ApplicantInstructorEditFormValues = z.infer<typeof applicantInstructorEditSchema>

export function rowToInstructorEditDraft(row: ApplicantInstructorRow): ApplicantInstructorEditDraft {
  const fee = resolveLectureFeeBasisFromRow(row)
  return {
    adminComment: row.managerComment ?? '',
    lectureFeeBasisType: fee.type,
    lectureFeeMeasure: fee.measure,
    lectureFeeAmount: fee.amount,
    instructorFeeGrade: row.instructorFeeGradeLabel?.trim() ?? '',
    businessIncomeEarnerStatus: parseBusinessIncomeStatus(row.businessIncomeEarnerStatus),
  }
}

export function draftToInstructorSavePayload(
  draft: ApplicantInstructorEditDraft
): ApplicantInstructorDetailSavePayload {
  const parsed = applicantInstructorEditSchema.parse(draft)
  const adminTrimmed = parsed.adminComment.trim()
  const amountDigits = parseLectureFeeAmountDigits(parsed.lectureFeeAmount)
  const instructorFeeGrade = parsed.instructorFeeGrade.trim()

  return {
    managerComment: adminTrimmed || undefined,
    lectureFeeBasisType: parsed.lectureFeeBasisType,
    lectureFeeMeasure:
      parsed.lectureFeeBasisType === 'program'
        ? undefined
        : parsed.lectureFeeMeasure.trim() || undefined,
    lectureFeeAmount: amountDigits || undefined,
    lectureFeeBasisDisplay: buildLectureFeeBasisDisplay(
      parsed.lectureFeeBasisType,
      parsed.lectureFeeMeasure,
      amountDigits
    ),
    instructorFeeGradeLabel: instructorFeeGrade || undefined,
    businessIncomeEarnerStatus: parsed.businessIncomeEarnerStatus,
  }
}

export function parseApplicantInstructorEditDraft(
  draft: ApplicantInstructorEditDraft
): { success: true; data: ApplicantInstructorEditFormValues } | { success: false; errors: Record<string, string> } {
  const result = applicantInstructorEditSchema.safeParse(draft)
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
