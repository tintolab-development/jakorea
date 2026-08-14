import type { SchoolTeacherEmploymentStatus, User } from '@/types/user'
import {
  fetchTeacherMemberDetailRemote,
  updateTeacherEmploymentStatusRemote,
} from '@/features/user/api/members-api-client'
import { mapTeacherMemberDetailToUser } from '@/features/user/api/map-member-detail-to-user'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'

/**
 * 교사 회원(겸직 아님) 재직 현황 저장 후 교사 상세를 재조회한다.
 * `PATCH …/organizations/schools/{organizationId}/teachers/{teacherMemberId}/employment-status`
 * → `GET /api/admin/users/{memberId}/teacher`
 */
export async function updateTeacherMemberEmploymentStatusAndRefresh(input: {
  memberId: number
  organizationId?: number
  employmentStatus: SchoolTeacherEmploymentStatus
}): Promise<Omit<User, 'password'>> {
  let organizationId = coercePositiveInt(input.organizationId)
  if (organizationId == null) {
    const current = await fetchTeacherMemberDetailRemote(input.memberId)
    organizationId = coercePositiveInt(current.organizationId)
  }
  if (organizationId == null) {
    throw new Error('학교 organizationId가 없어 재직 현황을 저장할 수 없습니다.')
  }

  await updateTeacherEmploymentStatusRemote(
    organizationId,
    input.memberId,
    input.employmentStatus
  )

  return mapTeacherMemberDetailToUser(await fetchTeacherMemberDetailRemote(input.memberId), {
    fallbackRole: 'INSTRUCTOR',
  })
}
