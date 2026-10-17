import type { SchoolTeacherEmploymentStatus } from '@jakorea/domain/instructor/employment-status'
import type { InstructorMemberType } from '@jakorea/domain/instructor/member-type'

export type InstructorEmploymentStatusToSync = Extract<
  SchoolTeacherEmploymentStatus,
  'ACTIVE' | 'ON_LEAVE'
>

/**
 * 강사 신청 폼의 재직 현황은 신청 스냅샷과 회원 프로필에 함께 반영되어야 한다.
 * 회원 프로필의 현재 값과 같으면 불필요한 PATCH를 만들지 않는다.
 */
export function resolveInstructorEmploymentStatusToSync(
  memberType: InstructorMemberType,
  nextStatus: SchoolTeacherEmploymentStatus | '',
  currentStatus: SchoolTeacherEmploymentStatus | ''
): InstructorEmploymentStatusToSync | undefined {
  if (memberType !== 'school_teacher' || nextStatus === currentStatus) return undefined
  if (nextStatus === 'ACTIVE' || nextStatus === 'ON_LEAVE') return nextStatus
  return undefined
}
