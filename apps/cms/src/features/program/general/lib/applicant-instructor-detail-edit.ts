import { z } from 'zod'
import type {
  ApplicantInstructorDetailSavePayload,
  ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'

export interface ApplicantInstructorEditDraft {
  adminComment: string
}

export const applicantInstructorEditSchema = z.object({
  adminComment: z.string(),
})

export type ApplicantInstructorEditFormValues = z.infer<typeof applicantInstructorEditSchema>

export function rowToInstructorEditDraft(row: ApplicantInstructorRow): ApplicantInstructorEditDraft {
  return {
    adminComment: row.managerComment ?? '',
  }
}

export function draftToInstructorSavePayload(
  draft: ApplicantInstructorEditDraft
): ApplicantInstructorDetailSavePayload {
  const parsed = applicantInstructorEditSchema.parse(draft)
  const adminTrimmed = parsed.adminComment.trim()
  return {
    managerComment: adminTrimmed || undefined,
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
