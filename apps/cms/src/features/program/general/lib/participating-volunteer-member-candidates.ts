import { getUserById, getUsers } from '@/entities/user/api/user-service'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'

export type ParticipatingVolunteerMemberCandidate = {
  memberId: string
  volunteerName: string
}

/** 개인 회원 목록 — 이미 참여 봉사자로 등록된 이름 제외 */
export async function fetchParticipatingVolunteerMemberCandidates(
  excludeVolunteerNames: readonly string[]
): Promise<ParticipatingVolunteerMemberCandidate[]> {
  const users = await getUsers({ role: 'INDIVIDUAL' })
  const excluded = new Set(excludeVolunteerNames.map(name => name.trim()))
  return users
    .filter(user => !excluded.has(user.name.trim()))
    .map(user => ({
      memberId: user.id,
      volunteerName: user.name,
    }))
}

export async function buildParticipatingVolunteerRowFromMember(
  memberId: string,
  nextNo: number,
  nextId: string
): Promise<ParticipatingVolunteerRow | null> {
  const user = await getUserById(memberId)
  if (!user || user.role !== 'INDIVIDUAL') return null

  const primarySchool =
    MOCK_PARTICIPATING_SCHOOLS[0]?.schoolName ?? '배정 기관 미정'

  return {
    id: nextId,
    no: nextNo,
    volunteerName: user.name,
    id1365: `1365${String(user.id).replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
    assignedInstitutionNames: [primarySchool],
    sessions: [],
    contact: user.phone ?? '',
    email: user.email,
  }
}
