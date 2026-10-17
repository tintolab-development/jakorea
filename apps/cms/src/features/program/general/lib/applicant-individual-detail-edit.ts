import { z } from 'zod'
import type {
  GeneralIndividualApplicantDetail,
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'

export interface ApplicantIndividualEditDraft {
  adminComment: string
  textbookId: string
  textbookName: string
  textbookKits: number
  textbookQuantity: number
  textbookStatus: TextbookStatusKey
  teamName: string
  teamMemberCountSelect: NonNullable<GeneralIndividualApplicantDetail['teamMemberCountSelect']>
  teamMemberCount: number
}

export const applicantIndividualEditSchema = z.object({
  adminComment: z.string(),
  textbookId: z.string(),
  textbookName: z.string(),
  teamName: z.string(),
  teamMemberCountSelect: z.enum(['1', '2', '3', '4', '5', 'custom']),
  teamMemberCount: z.number().min(1),
})

export type ApplicantIndividualEditFormValues = z.infer<typeof applicantIndividualEditSchema>

export function rowToIndividualEditDraft(
  row: GeneralIndividualApplicantRow,
  _program: Program | null = null
): ApplicantIndividualEditDraft {
  return {
    adminComment: row.adminComment ?? '',
    textbookId:
      !row.textbookId?.trim() || row.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE
        ? TEXTBOOK_NOT_USED_OPTION_VALUE
        : row.textbookId,
    textbookName:
      !row.textbookId?.trim() ||
      row.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE ||
      row.textbookName === '해당 없음'
        ? '해당 없음'
        : (row.textbookName ?? ''),
    textbookKits: row.textbookKits ?? 0,
    textbookQuantity: row.textbookQuantity ?? 0,
    textbookStatus:
      !row.textbookId?.trim() ||
      row.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE ||
      row.textbookName === '해당 없음'
        ? 'not_applicable'
        : (row.textbookStatus ?? 'preparing'),
    teamName: row.detail?.teamName ?? '',
    teamMemberCountSelect: row.detail?.teamMemberCountSelect ?? '1',
    teamMemberCount: row.detail?.teamMemberCount ?? 1,
  }
}

export function draftToIndividualSavePayload(
  draft: ApplicantIndividualEditDraft,
  _program: Program | null,
  _row: GeneralIndividualApplicantRow
): GeneralIndividualApplicantDetailSavePayload {
  const parsed = applicantIndividualEditSchema.parse(draft)
  const adminTrimmed = parsed.adminComment.trim()
  const isTextbookNotUsed = parsed.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE

  return {
    adminComment: adminTrimmed || undefined,
    textbookId: isTextbookNotUsed ? TEXTBOOK_NOT_USED_OPTION_VALUE : parsed.textbookId || undefined,
    textbookName: isTextbookNotUsed ? '해당 없음' : parsed.textbookName || undefined,
    teamName: parsed.teamName.trim() || undefined,
    teamMemberCount: parsed.teamMemberCount,
    teamMemberCountSelect: parsed.teamMemberCountSelect,
  }
}

export function parseApplicantIndividualEditDraft(
  draft: ApplicantIndividualEditDraft
):
  | { success: true; data: ApplicantIndividualEditFormValues }
  | { success: false; errors: Record<string, string> } {
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
