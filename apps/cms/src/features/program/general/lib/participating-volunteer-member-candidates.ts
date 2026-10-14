import {
  fetchProgramParticipantRegisterCandidatesRemote,
  type VolunteerKind,
} from '@/features/program/general/api/program-progress-api-client'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'

export type ParticipatingVolunteerMemberCandidate = {
  memberId: string
  volunteerName: string
  /** 회원 프로필에 1365 ID가 이미 등록되어 있으면 true */
  hasRegisteredId1365: boolean
}

export function hasRegisteredVolunteerId1365(id1365: string | undefined | null): boolean {
  return Boolean(id1365?.trim())
}

export type FetchParticipatingVolunteerMemberCandidatesParams = {
  programId: string
  volunteerKind: VolunteerKind
  /** BE가 제외하나, 목록 갱신 전 중복 방지용 */
  excludedMemberIds: readonly number[]
  keyword?: string
}

const CANDIDATE_PAGE_SIZE = 20
const MAX_CANDIDATE_PAGES = 50

function mapRemoteCandidateItems(
  items: Array<{
    memberId: number
    displayName?: string
    hasRegisteredId1365?: boolean
    eligible?: boolean
  }>,
  excludedMemberIds: ReadonlySet<number>
): ParticipatingVolunteerMemberCandidate[] {
  return items
    .filter(item => item.memberId > 0 && !excludedMemberIds.has(item.memberId))
    .filter(item => item.eligible !== false)
    .map(item => ({
      memberId: String(item.memberId),
      volunteerName: item.displayName?.trim() || `회원 ${item.memberId}`,
      hasRegisteredId1365: item.hasRegisteredId1365 === true,
    }))
}

async function fetchAllVolunteerRegisterCandidatesRemote(
  programId: string,
  volunteerKind: VolunteerKind,
  keyword?: string
): Promise<
  Array<{
    memberId: number
    displayName?: string
    hasRegisteredId1365?: boolean
    eligible?: boolean
  }>
> {
  const aggregated: Array<{
    memberId: number
    displayName?: string
    hasRegisteredId1365?: boolean
    eligible?: boolean
  }> = []

  for (let page = 0; page < MAX_CANDIDATE_PAGES; page += 1) {
    const response = await fetchProgramParticipantRegisterCandidatesRemote(programId, {
      participantType: 'VOLUNTEER',
      volunteerKind,
      keyword: keyword?.trim() || undefined,
      page,
      size: CANDIDATE_PAGE_SIZE,
    })
    const items = response.items ?? []
    for (const item of items) {
      if (item.memberId == null) continue
      aggregated.push({
        memberId: item.memberId,
        displayName: item.displayName,
        hasRegisteredId1365: item.hasRegisteredId1365,
        eligible: item.eligible,
      })
    }
    const totalPages = response.totalPages ?? 1
    if (page + 1 >= totalPages || items.length === 0) break
  }

  return aggregated
}

/** 참여 봉사자 추가 등록 — GET …/participant-register-candidates (SSOT) */
export async function fetchParticipatingVolunteerMemberCandidates(
  params: FetchParticipatingVolunteerMemberCandidatesParams
): Promise<ParticipatingVolunteerMemberCandidate[]> {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    throw new Error('참여 봉사자 등록은 실 API 환경에서만 지원합니다.')
  }

  const excluded = new Set(params.excludedMemberIds.filter(id => Number.isFinite(id) && id > 0))
  const items = await fetchAllVolunteerRegisterCandidatesRemote(
    params.programId,
    params.volunteerKind,
    params.keyword
  )
  return mapRemoteCandidateItems(items, excluded)
}
