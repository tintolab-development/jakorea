import type { User } from '@/types/user'

/** 학교(기관) 회원 — 소속 교사 등록이 있으면 목록/일괄 삭제 차단 */
export function institutionHasRegisteredTeachers(
  u: Pick<User, 'listMetrics' | 'schoolInfo'>
): boolean {
  const count = u.listMetrics?.institutionRegisteredTeacherCount
  if (typeof count === 'number' && count > 0) return true
  const teachers = u.schoolInfo?.affiliatedTeachers
  return Array.isArray(teachers) && teachers.length > 0
}
