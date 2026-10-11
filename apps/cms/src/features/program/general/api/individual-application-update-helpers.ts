import { updateIndividualApplication } from '@/features/program/general/api/applications-api-client'
import { resolveIndividualApplicationTeamDetail } from '@/features/program/general/lib/individual-application-team-detail'
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
  const teamDetail = resolveIndividualApplicationTeamDetail({ team: response.team })

  return {
    ...row,
    availableActions: response.availableActions ?? row.availableActions,
    adminComment:
      response.managerComment === null
        ? undefined
        : (response.managerComment ?? row.adminComment),
    textbookId: textbook?.id != null ? String(textbook.id) : undefined,
    textbookName: textbook == null ? '해당 없음' : textbook?.name,
    textbookKits: textbook == null ? 0 : textbook?.kits,
    textbookQuantity: textbook == null ? 0 : textbook?.quantity,
    textbookStatus:
      textbook == null
        ? 'not_applicable'
        : (textbook?.status?.toLowerCase() as GeneralIndividualApplicantRow['textbookStatus']),
    detail: {
      ...row.detail,
      teamName: teamDetail.teamName ?? row.detail?.teamName,
      teamMemberCount: teamDetail.teamMemberCount ?? row.detail?.teamMemberCount,
      teamMemberCountSelect: teamDetail.teamMemberCountSelect ?? row.detail?.teamMemberCountSelect,
      teamRole: teamDetail.teamRole ?? row.detail?.teamRole,
    },
  }
}

/** 신청 PATCH/GET용 PK. 진행현황 행은 `individualApplicationId`, 신청 목록은 `id`. */
export function resolveIndividualApplicationId(
  applicant: Pick<GeneralIndividualApplicantRow, 'id' | 'individualApplicationId'>
): string | null {
  const mapped = applicant.individualApplicationId?.trim()
  if (mapped) return mapped
  const fallback = applicant.id?.trim()
  return fallback || null
}

/** PATCH individual-applications — 교재·팀 운영정보 */
export async function saveIndividualApplicationDetailRemote(
  applicant: GeneralIndividualApplicantRow,
  payload: GeneralIndividualApplicantDetailSavePayload
): Promise<GeneralIndividualApplicantRow> {
  const applicationId = resolveIndividualApplicationId(applicant)
  if (!applicationId) {
    throw new Error('개인 신청 ID가 없어 저장할 수 없습니다.')
  }
  const response = await updateIndividualApplication(applicationId, {
    textbookId:
      payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || !payload.textbookId?.trim()
        ? null
        : Number(payload.textbookId),
    teamName: payload.teamName?.trim() || null,
    teamMemberCount: payload.teamMemberCount,
  })
  const responseRow = mergeIndividualApplicationUpdateResponse(applicant, response)
  if (
    payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE ||
    !payload.textbookId?.trim() ||
    response.textbook == null
  ) {
    return {
      ...responseRow,
      textbookId: undefined,
      textbookName: '해당 없음',
      textbookKits: 0,
      textbookQuantity: 0,
      textbookStatus: 'not_applicable',
    }
  }
  return responseRow
}

/** PATCH individual-applications — managerComment only */
export async function saveIndividualApplicationAdminCommentRemote(
  applicant: GeneralIndividualApplicantRow,
  managerComment: string
): Promise<GeneralIndividualApplicantRow> {
  const applicationId = resolveIndividualApplicationId(applicant)
  if (!applicationId) {
    throw new Error('개인 신청 ID가 없어 코멘트를 저장할 수 없습니다.')
  }
  const response = await updateIndividualApplication(applicationId, {
    managerComment: managerComment.trim() || null,
  })
  return mergeIndividualApplicationUpdateResponse(applicant, response)
}
