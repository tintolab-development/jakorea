import { getUserById, getUsers } from '@/entities/user/api/user-service'
import { USER_AFFILIATION_PIPE_SEP } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/ujat-education-progress-tabs'
import type { User } from '@/types/user'
import type {
  UjatEducationProgressVolunteerGrade,
  UjatEducationProgressVolunteerMemberCandidate,
  UjatEducationProgressVolunteerRow,
} from './types'
import { UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS } from './types'

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ?? regionKey
  )
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
  return 'seoul'
}

function normalizeVolunteerGrade(raw: string): UjatEducationProgressVolunteerGrade {
  const g = raw.trim()
  if (!g) return '1학년'
  if (g.includes('휴학')) return '휴학생'
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

export function mapIndividualUserToVolunteerMemberCandidate(
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

/** 회원 관리 회원 목록 API와 동일 — 회원 유형 `개인`(INDIVIDUAL)만 조회 */
export async function fetchUjatEducationProgressVolunteerMemberCandidates(
  excludeVolunteerNames: string[]
): Promise<UjatEducationProgressVolunteerMemberCandidate[]> {
  const users = await getUsers({ role: 'INDIVIDUAL' })
  const excluded = new Set(excludeVolunteerNames.map(name => name.trim()))
  return users
    .filter(user => !excluded.has(user.name.trim()))
    .map(mapIndividualUserToVolunteerMemberCandidate)
}

export async function buildUjatEducationProgressVolunteerRowFromMember(
  half: EducationProgressHalfKey,
  memberId: string,
  nextNo: number
): Promise<UjatEducationProgressVolunteerRow | null> {
  const user = await getUserById(memberId)
  if (!user || user.role !== 'INDIVIDUAL') return null

  const member = mapIndividualUserToVolunteerMemberCandidate(user)

  return {
    id: `${half}-vol-added-${memberId}`,
    no: nextNo,
    volunteerName: member.volunteerName,
    grade: member.grade,
    regionKey: member.regionKey,
    regionLabel: regionLabelForKey(member.regionKey),
    mobile: member.mobile,
    email: member.email,
    totalAssignmentDays: null,
    assignmentStatus: 'assignment_waiting',
  }
}
