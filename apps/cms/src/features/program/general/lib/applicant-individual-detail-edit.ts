import { z } from 'zod'
import type {
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'

export interface ApplicantIndividualEditDraft {
  adminComment: string
}

export const applicantIndividualEditSchema = z.object({
  adminComment: z.string(),
})

export type ApplicantIndividualEditFormValues = z.infer<typeof applicantIndividualEditSchema>

export function rowToIndividualEditDraft(row: GeneralIndividualApplicantRow): ApplicantIndividualEditDraft {
  return {
    adminComment: row.adminComment ?? '',
  }
}

export function draftToIndividualSavePayload(
  draft: ApplicantIndividualEditDraft
): GeneralIndividualApplicantDetailSavePayload {
  const parsed = applicantIndividualEditSchema.parse(draft)
  const adminTrimmed = parsed.adminComment.trim()
  return {
    adminComment: adminTrimmed || undefined,
  }
}

export function parseApplicantIndividualEditDraft(
  draft: ApplicantIndividualEditDraft
): { success: true; data: ApplicantIndividualEditFormValues } | { success: false; errors: Record<string, string> } {
  const result = applicantIndividualEditSchema.safeParse(draft)
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
