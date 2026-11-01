import { getUserById } from '@/entities/user/api/user-service'
import { fetchParticipatingVolunteerMemberCandidates } from '@/features/program/general/lib/participating-volunteer-member-candidates'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { USER_AFFILIATION_PIPE_SEP } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { parseUjatVolAddMemberIdParam } from '@/features/program/ujat/lib/ujat-program-detail-url'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { User } from '@/types/user'
import type {
  UjatEducationProgressVolunteerGrade,
  UjatEducationProgressVolunteerMemberCandidate,
  UjatEducationProgressVolunteerRow,
} from './types'
import { UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS } from './types'

/** 회원 상세 hydrate용 — 추가 등록 직후 목록 반영에만 사용 */
type UjatVolunteerMemberProfile = {
  memberId: string
  volunteerName: string
  grade: UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  mobile: string
  email: string
}

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return getUjatEducationRegionLabel(regionKey, regionKey)
}

function parseRegionKeyFromAddress(address: string | undefined): UjatInstitutionApplicationRegionKey {
  const a = (address ?? '').trim()
  if (a.includes('서울')) return 'seoul'
  if (a.includes('경기')) return 'gyeonggi_south'
  if (a.includes('인천')) return 'incheon'
  if (a.includes('대전')) return 'daejeon'
  if (a.includes('대구')) return 'daegu'
  if (a.includes('부산')) return 'busan'
  if (a.includes('광주')) return 'gwangju'
  if (a.includes('전주') || a.includes('전북')) return 'jeonbuk_jeonju'
  return ''
}

function normalizeVolunteerGrade(raw: string): UjatEducationProgressVolunteerGrade {
  const g = raw.trim()
  if (!g) return '1학년'
  if (g.includes('휴학')) return '휴학'
  if (g.includes('졸업유예') || g.includes('졸업 유예')) return '졸업유예'

  const matched = UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS.find(
    opt => g === opt || g.endsWith(opt)
  )
  if (matched) return matched

  const gradeMatch = g.match(/(\d)학년/)
  if (gradeMatch) {
    const candidate = `${gradeMatch[1]}학년` as UjatEducationProgressVolunteerGrade
    if (UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS.includes(candidate)) return candidate
  }

  return '1학년'
}

function parseGradeFromAffiliation(affiliation: string | undefined): UjatEducationProgressVolunteerGrade {
  const s = (affiliation ?? '').trim()
  if (!s) return '1학년'
  const idx = s.indexOf(USER_AFFILIATION_PIPE_SEP)
  const gradePart = idx === -1 ? '' : s.slice(idx + USER_AFFILIATION_PIPE_SEP.length).trim()
  return normalizeVolunteerGrade(gradePart)
}

function resolveNumericMemberIdString(user: Omit<User, 'password'>): string | null {
  if (user.memberId != null) {
    return parseUjatVolAddMemberIdParam(String(user.memberId))
  }
  return null
}

/** 후보 셀렉트 value = BE register `memberId`(숫자). UUID만 있으면 제외. */
export function mapVolunteerUserToMemberCandidate(
  user: Omit<User, 'password'>
): UjatVolunteerMemberProfile | null {
  const memberId = resolveNumericMemberIdString(user)
  if (memberId == null) {
    console.warn(
      '[ujat-volunteer-candidates] skip user without numeric memberId',
      user.id
    )
    return null
  }
  return {
    memberId,
    volunteerName: user.name,
    grade: parseGradeFromAffiliation(user.affiliation),
    regionKey: parseRegionKeyFromAddress(user.detailAddress),
    mobile: user.phone ?? '',
    email: user.email,
  }
}

function memberRolesIncludeVolunteer(roles: string[] | undefined): boolean {
  return (roles ?? []).some(role => role.trim().toUpperCase() === 'VOLUNTEER')
}

/**
 * UJAT 참여 봉사자 추가 등록 후보 —
 * `GET /api/admin/programs/{programId}/participant-register-candidates`
 * (`volunteerKind=GENERAL`, 일반 프로그램 참여 봉사자 모달과 동일 SSOT)
 */
export async function fetchUjatEducationProgressVolunteerMemberCandidates(
  programId: string,
  excludeMemberIds: readonly string[] = []
): Promise<UjatEducationProgressVolunteerMemberCandidate[]> {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    throw new Error(
      '봉사자 등록 후보는 실 API만 지원합니다. VITE_API_SERVER 또는 VITE_API_BASE_URL을 설정하세요.'
    )
  }
  if (!programId.trim()) {
    throw new Error('programId가 필요합니다.')
  }

  const excludedMemberIds = excludeMemberIds
    .map(id => Number(parseUjatVolAddMemberIdParam(id) ?? id))
    .filter(id => Number.isFinite(id) && id > 0)

  const remote = await fetchParticipatingVolunteerMemberCandidates({
    programId,
    volunteerKind: 'GENERAL',
    excludedMemberIds,
  })

  return remote.map(item => ({
    memberId: item.memberId,
    volunteerName: item.volunteerName,
    hasRegisteredId1365: item.hasRegisteredId1365,
  }))
}

export async function buildUjatEducationProgressVolunteerRowFromMember(
  half: EducationProgressHalfKey,
  memberId: string,
  nextNo: number
): Promise<UjatEducationProgressVolunteerRow | null> {
  const numericMemberId = parseUjatVolAddMemberIdParam(memberId)
  if (numericMemberId == null) return null

  const user = await getUserById(memberId, { memberId: Number(numericMemberId) })
  if (!user) return null
  if (user.roles?.length && !memberRolesIncludeVolunteer(user.roles)) return null

  const member = mapVolunteerUserToMemberCandidate(user)
  if (!member) return null

  return {
    id: `${half}-vol-added-${numericMemberId}`,
    no: nextNo,
    volunteerName: member.volunteerName,
    grade: member.grade,
    regionKey: member.regionKey,
    regionLabel: regionLabelForKey(member.regionKey),
    mobile: member.mobile,
    email: member.email,
    totalAssignedDays: null,
    assignmentStatus: 'assignment_waiting',
    memberId: numericMemberId,
  }
}
