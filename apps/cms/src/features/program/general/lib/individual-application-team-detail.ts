import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import type { GeneralIndividualApplicantDetail } from '@/features/program/general/model/individual-applicant'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

type TeamDetailSlice = Pick<
  GeneralIndividualApplicantDetail,
  'teamName' | 'teamMemberCount' | 'teamMemberCountSelect' | 'teamRole'
>

const TEAM_INFO_ANSWER_KEY = PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo

const TEAM_INFO_DOT_PREFIX = 'application.individual.teamInfo.'

function normalizeTeamRole(
  raw?: string | null
): GeneralIndividualApplicantDetail['teamRole'] | undefined {
  const normalized = raw?.trim().toUpperCase()
  if (normalized === 'LEADER') return 'leader'
  if (normalized === 'MEMBER') return 'member'
  const lower = raw?.trim().toLowerCase()
  if (lower === 'leader' || lower === 'member') return lower
  return undefined
}

function memberCountSelectFromCount(
  count: number | undefined
): GeneralIndividualApplicantDetail['teamMemberCountSelect'] | undefined {
  if (count == null || !Number.isFinite(count)) return undefined
  if (count >= 1 && count <= 5) {
    return String(count) as GeneralIndividualApplicantDetail['teamMemberCountSelect']
  }
  return 'custom'
}

function teamDetailFromFormAnswerObject(answer: Record<string, unknown>): TeamDetailSlice | null {
  const teamName = typeof answer.teamName === 'string' ? answer.teamName.trim() : ''
  const memberCountSelect =
    typeof answer.memberCountSelect === 'string' ? answer.memberCountSelect.trim() : ''
  const customMemberCount =
    typeof answer.customMemberCount === 'string' ? answer.customMemberCount.trim() : ''
  const teamRole = normalizeTeamRole(
    typeof answer.teamRole === 'string' ? answer.teamRole : undefined
  )

  if (!teamName && !memberCountSelect && !teamRole) return null

  let teamMemberCount: number | undefined
  let teamMemberCountSelect: TeamDetailSlice['teamMemberCountSelect']

  if (memberCountSelect === 'custom') {
    const parsed = Number.parseInt(customMemberCount, 10)
    teamMemberCount = Number.isFinite(parsed) ? parsed : undefined
    teamMemberCountSelect = 'custom'
  } else if (memberCountSelect) {
    const parsed = Number.parseInt(memberCountSelect, 10)
    teamMemberCount = Number.isFinite(parsed) ? parsed : undefined
    teamMemberCountSelect = memberCountSelectFromCount(teamMemberCount)
  }

  return {
    teamName: teamName || undefined,
    teamMemberCount,
    teamMemberCountSelect,
    teamRole: teamRole ?? (teamName || memberCountSelect ? 'leader' : undefined),
  }
}

function readFormAnswerString(
  formAnswers: Record<string, unknown>,
  suffix: string
): string | undefined {
  const value = formAnswers[`${TEAM_INFO_DOT_PREFIX}${suffix}`]
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function teamDetailFromFormAnswers(
  formAnswers?: Record<string, unknown> | null
): TeamDetailSlice | null {
  if (!formAnswers) return null

  const paragraphAnswer = formAnswers[TEAM_INFO_ANSWER_KEY]
  if (paragraphAnswer && typeof paragraphAnswer === 'object' && !Array.isArray(paragraphAnswer)) {
    const fromParagraph = teamDetailFromFormAnswerObject(paragraphAnswer as Record<string, unknown>)
    if (fromParagraph) return fromParagraph
  }

  const teamName = readFormAnswerString(formAnswers, 'teamName')
  const memberCountSelect = readFormAnswerString(formAnswers, 'memberCountSelect')
  const customMemberCount = readFormAnswerString(formAnswers, 'customMemberCount')
  const teamRoleRaw = readFormAnswerString(formAnswers, 'teamRole')

  if (!teamName && !memberCountSelect && !teamRoleRaw) return null

  return teamDetailFromFormAnswerObject({
    teamName: teamName ?? '',
    memberCountSelect: memberCountSelect ?? '',
    customMemberCount: customMemberCount ?? '',
    teamRole: teamRoleRaw ?? '',
  })
}

function teamDetailFromApiTeam(team: unknown): TeamDetailSlice {
  if (!team || typeof team !== 'object') return {}
  const row = team as Record<string, unknown>
  const teamName =
    (typeof row.name === 'string' ? row.name.trim() : '') ||
    (typeof row.teamName === 'string' ? row.teamName.trim() : '') ||
    undefined
  const memberCountRaw =
    typeof row.memberCount === 'number'
      ? row.memberCount
      : typeof row.teamMemberCount === 'number'
        ? row.teamMemberCount
        : undefined
  const teamRole = normalizeTeamRole(
    typeof row.role === 'string'
      ? row.role
      : typeof row.teamRole === 'string'
        ? row.teamRole
        : undefined
  )

  return {
    teamName,
    teamMemberCount: memberCountRaw,
    teamMemberCountSelect: memberCountSelectFromCount(memberCountRaw),
    teamRole,
  }
}

function hasTeamDetailValue(slice: TeamDetailSlice): boolean {
  return Boolean(
    slice.teamName?.trim() ||
      slice.teamRole ||
      slice.teamMemberCount != null ||
      slice.teamMemberCountSelect
  )
}

function mergeTeamDetailSlices(
  primary: TeamDetailSlice,
  fallback: TeamDetailSlice
): TeamDetailSlice {
  return {
    teamName: primary.teamName ?? fallback.teamName,
    teamMemberCount: primary.teamMemberCount ?? fallback.teamMemberCount,
    teamMemberCountSelect: primary.teamMemberCountSelect ?? fallback.teamMemberCountSelect,
    teamRole: primary.teamRole ?? fallback.teamRole,
  }
}

/**
 * 개인 신청 상세 — `team` projection + formAnswers 팀 단락을 UI detail로 통합.
 * BE `IndividualApplicationAdminService.resolveTeam`: DB 운영값 우선, 없으면 form_response fallback.
 * FE도 API `team`에 값이 있으면 우선하고, 빈 필드만 formAnswers로 보완한다.
 */
export function resolveIndividualApplicationTeamDetail(input: {
  team?: unknown
  formAnswers?: Record<string, unknown> | null
}): TeamDetailSlice {
  const fromApi = teamDetailFromApiTeam(input.team)
  const fromForm = teamDetailFromFormAnswers(input.formAnswers) ?? {}

  const merged = hasTeamDetailValue(fromApi)
    ? mergeTeamDetailSlices(fromApi, fromForm)
    : mergeTeamDetailSlices(fromForm, fromApi)

  return merged
}

export const INDIVIDUAL_TEAM_EDIT_AFTER_APPROVAL_ALERT = {
  title: '팀 정보 수정 안내',
  content: '참여자 신청 승인 후에 팀 정보를 변경할 수 있습니다.',
} as const

export function isIndividualApplicationApprovedOnlyUpdateError(error: unknown): boolean {
  const code = (getApiErrorCode(error) ?? '').toUpperCase()
  if (code.includes('NOT_APPROVED')) return true
  const responseData =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const message = extractApiErrorMessage(responseData, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: '',
  })
  return message.includes('승인된 개인 신청에서만')
}
