import { updateIndividualApplication } from '@/features/program/general/api/applications-api-client'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type {
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import type { IndividualApplicationUpdateResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateResponse'

export function mergeIndividualApplicationUpdateResponse(
  row: GeneralIndividualApplicantRow,
  response: IndividualApplicationUpdateResponse
): GeneralIndividualApplicantRow {
  const textbook = response.textbook as
    | {
        id?: number
        name?: string
        kits?: number
        quantity?: number
        status?: string
      }
    | null
    | undefined
  const team = response.team as
    | {
        name?: string
        teamName?: string
        memberCount?: number
        role?: string
      }
    | undefined
  const role = team?.role?.toUpperCase()

  return {
    ...row,
    availableActions: response.availableActions ?? row.availableActions,
    adminComment:
      response.managerComment === null
        ? undefined
        : (response.managerComment ?? row.adminComment),
    textbookId: textbook?.id != null ? String(textbook.id) : undefined,
    textbookName: textbook?.name,
    textbookKits: textbook?.kits,
    textbookQuantity: textbook?.quantity,
    textbookStatus: textbook?.status?.toLowerCase() as GeneralIndividualApplicantRow['textbookStatus'],
    detail: {
      ...row.detail,
      teamName: team?.name ?? team?.teamName ?? row.detail?.teamName,
      teamMemberCount: team?.memberCount ?? row.detail?.teamMemberCount,
      teamMemberCountSelect:
        team?.memberCount != null && team.memberCount >= 1 && team.memberCount <= 5
          ? (String(team.memberCount) as '1' | '2' | '3' | '4' | '5')
          : team?.memberCount != null
            ? 'custom'
            : row.detail?.teamMemberCountSelect,
      teamRole:
        role === 'LEADER' || role === 'MEMBER'
          ? (role.toLowerCase() as 'leader' | 'member')
          : row.detail?.teamRole,
    },
  }
}

/** PATCH individual-applications — 교재·팀 운영정보 */
export async function saveIndividualApplicationDetailRemote(
  applicant: GeneralIndividualApplicantRow,
  payload: GeneralIndividualApplicantDetailSavePayload
): Promise<GeneralIndividualApplicantRow> {
  const response = await updateIndividualApplication(applicant.id, {
    textbookId:
      payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE
        ? null
        : payload.textbookId
          ? Number(payload.textbookId)
          : undefined,
    teamName: payload.teamName?.trim() || null,
    teamMemberCount: payload.teamMemberCount,
  })
  const responseRow = mergeIndividualApplicationUpdateResponse(applicant, response)
  if (payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE) {
    return {
      ...responseRow,
      textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
      textbookName: '해당 없음',
      textbookKits: 0,
      textbookQuantity: 0,
    }
  }
  return responseRow
}

/** PATCH individual-applications — managerComment only */
export async function saveIndividualApplicationAdminCommentRemote(
  applicant: GeneralIndividualApplicantRow,
  managerComment: string
): Promise<GeneralIndividualApplicantRow> {
  const response = await updateIndividualApplication(applicant.id, {
    managerComment: managerComment.trim() || null,
  })
  return mergeIndividualApplicationUpdateResponse(applicant, response)
}
