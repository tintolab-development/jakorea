import { getUserById } from '@/entities/user/api/user-service'
import { mapAccountDirectoryItems } from '@/features/user/api/map-account-directory-item-to-user'
import { fetchAllCmsMembersAndAdminsPageRemote } from '@/features/user/api/members-api-client'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { USER_AFFILIATION_PIPE_SEP } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { User } from '@/types/user'
import type {
  UjatEducationProgressVolunteerGrade,
  UjatEducationProgressVolunteerMemberCandidate,
  UjatEducationProgressVolunteerRow,
} from './types'
import { UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS } from './types'

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

export function mapVolunteerUserToMemberCandidate(
  user: Omit<User, 'password'>
): UjatEducationProgressVolunteerMemberCandidate {
  return {
    memberId: user.id,
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

const DIRECTORY_PAGE_SIZE = 20
const MAX_DIRECTORY_PAGES = 50

async function fetchVolunteerDirectoryMembers() {
  const users: ReturnType<typeof mapAccountDirectoryItems> = []
  for (let page = 0; page < MAX_DIRECTORY_PAGES; page += 1) {
    const response = await fetchAllCmsMembersAndAdminsPageRemote({
      accountType: 'MEMBER',
      page,
      size: DIRECTORY_PAGE_SIZE,
    })
    users.push(...mapAccountDirectoryItems(response.items))
    const totalPages = response.totalPages ?? 1
    const itemCount = response.items?.length ?? 0
    if (page + 1 >= totalPages || itemCount === 0) break
  }
  return users.filter(user => memberRolesIncludeVolunteer(user.roles))
}

/**
 * 회원 관리 봉사자 목록 — `GET /api/admin/members/all?accountType=MEMBER`
 * 후 `roles`에 `VOLUNTEER`이 있는 회원만. (`memberType=INDIVIDUAL`은 강사·교사·일반이 섞인다)
 */
export async function fetchUjatEducationProgressVolunteerMemberCandidates(
  excludeVolunteerNames: string[],
  excludeMemberIds: readonly string[] = []
): Promise<UjatEducationProgressVolunteerMemberCandidate[]> {
  if (!isMembersRemoteEnabled()) {
    throw new Error('회원 목록은 실 API만 지원합니다. VITE_API_SERVER 또는 VITE_API_BASE_URL을 설정하세요.')
  }
  const users = await fetchVolunteerDirectoryMembers()
  const excludedNames = new Set(excludeVolunteerNames.map(name => name.trim()).filter(Boolean))
  const excludedIds = new Set(excludeMemberIds.map(id => id.trim()).filter(Boolean))
  return users
    .filter(user => {
      if (excludedNames.has(user.name.trim())) return false
      if (excludedIds.has(user.id) || (user.memberId != null && excludedIds.has(String(user.memberId)))) {
        return false
      }
      return true
    })
    .map(mapVolunteerUserToMemberCandidate)
}

export async function buildUjatEducationProgressVolunteerRowFromMember(
  half: EducationProgressHalfKey,
  memberId: string,
  nextNo: number
): Promise<UjatEducationProgressVolunteerRow | null> {
  const user = await getUserById(memberId)
  if (!user) return null
  if (user.roles?.length && !memberRolesIncludeVolunteer(user.roles)) return null

  const member = mapVolunteerUserToMemberCandidate(user)

  return {
    id: `${half}-vol-added-${memberId}`,
    no: nextNo,
    volunteerName: member.volunteerName,
    grade: member.grade,
    regionKey: member.regionKey,
    regionLabel: regionLabelForKey(member.regionKey),
    mobile: member.mobile,
    email: member.email,
    totalAssignedDays: null,
    assignmentStatus: 'assignment_waiting',
  }
}
