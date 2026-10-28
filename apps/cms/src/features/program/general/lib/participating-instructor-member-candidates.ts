import { fetchAllMembersPagesRemote } from '@/features/user/api/fetch-all-members-pages-remote'
import { instructorListRolesExactAnyOf } from '@/features/user/api/map-roles-exact-any-of'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
export type ParticipatingInstructorMemberCandidate = {
  memberId: string
  instructorName: string
}

/** 강사 회원 목록(remote) — 이미 참여 강사로 등록된 이름 제외 */
export async function fetchParticipatingInstructorMemberCandidates(
  excludeInstructorNames: readonly string[]
): Promise<ParticipatingInstructorMemberCandidate[]> {
  if (!isMembersRemoteEnabled()) {
    throw new Error('회원 목록은 실 API만 지원합니다. VITE_API_SERVER 또는 VITE_API_BASE_URL을 설정하세요.')
  }

  const excluded = new Set(excludeInstructorNames.map(name => name.trim()))
  const users = await fetchAllMembersPagesRemote({
    rolesExactAnyOf: instructorListRolesExactAnyOf(),
  })

  return users
    .filter(user => !excluded.has(user.name.trim()))
    .flatMap(user =>
      user.memberId != null ? [{ memberId: String(user.memberId), instructorName: user.name }] : []
    )
}
