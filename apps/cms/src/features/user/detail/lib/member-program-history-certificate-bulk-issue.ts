import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import type { User } from '@/types/user'

export function memberShowsProgramHistoryCertificateBulkIssue(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): boolean {
  /** 학교(기관) 상세 — 프로그램 참여 이력(수강 이력)에서는 일괄 발급 미노출 */
  if (user.role === 'SCHOOL') return false
  if (user.role !== 'INSTRUCTOR') return true
  return resolveInstructorMemberProfile(user) !== 'school_teacher'
}

/** 봉사 프로그램 참여 이력 — 교사(겸직x) 포함 전 회원 유형 동일 툴바(활동·수료증 일괄 발급) */
export function memberShowsVolunteerHistoryCertificateBulkIssue(
  user: Pick<User, 'role'>
): boolean {
  return user.role !== 'SCHOOL'
}
