import { z } from 'zod'
import type {
  GeneralIndividualApplicantDetail,
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import {
  calculateParticipatingTextbookKitQuantity,
} from '@/features/program/general/lib/participating-institution-textbook'
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
  program: Program | null = null
): ApplicantIndividualEditDraft {
  const participantCount = row.detail?.teamMemberCount ?? 1
  const kitQuantity = program
    ? calculateParticipatingTextbookKitQuantity(program, participantCount)
    : { textbookKits: row.textbookKits ?? 0, textbookQuantity: row.textbookQuantity ?? 0 }

  return {
    adminComment: row.adminComment ?? '',
    textbookId: row.textbookId ?? '',
    textbookName: row.textbookName ?? '',
    textbookKits: kitQuantity.textbookKits,
    textbookQuantity: kitQuantity.textbookQuantity,
    textbookStatus: row.textbookStatus ?? 'not_applicable',
    teamName: row.detail?.teamName ?? '',
    teamMemberCountSelect: row.detail?.teamMemberCountSelect ?? '1',
    teamMemberCount: row.detail?.teamMemberCount ?? 1,
  }
}

export function draftToIndividualSavePayload(
  draft: ApplicantIndividualEditDraft,
  program: Program | null,
  _row: GeneralIndividualApplicantRow
): GeneralIndividualApplicantDetailSavePayload {
  const parsed = applicantIndividualEditSchema.parse(draft)
  const adminTrimmed = parsed.adminComment.trim()

  const participantCount = parsed.teamMemberCount
  const kitQuantity = program
    ? calculateParticipatingTextbookKitQuantity(program, participantCount)
    : { textbookKits: draft.textbookKits, textbookQuantity: draft.textbookQuantity }

  const isTextbookNotUsed = parsed.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE

  return {
    adminComment: adminTrimmed || undefined,
    textbookId: isTextbookNotUsed ? TEXTBOOK_NOT_USED_OPTION_VALUE : parsed.textbookId || undefined,
    textbookName: isTextbookNotUsed ? '해당 없음' : parsed.textbookName || undefined,
    textbookKits: isTextbookNotUsed ? 0 : kitQuantity.textbookKits,
    textbookQuantity: isTextbookNotUsed ? 0 : kitQuantity.textbookQuantity,
    textbookStatus: isTextbookNotUsed
      ? 'not_applicable'
      : parsed.textbookId
        ? draft.textbookStatus === 'not_applicable'
          ? 'preparing'
          : draft.textbookStatus
        : undefined,
    teamName: parsed.teamName.trim() || undefined,
    teamMemberCount: parsed.teamMemberCount,
    teamMemberCountSelect: parsed.teamMemberCountSelect,
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
