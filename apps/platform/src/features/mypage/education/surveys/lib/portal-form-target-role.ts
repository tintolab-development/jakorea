import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationSatisfactionAudience } from './seed-survey-draft'

function normalizePortalFormRole(value: string): string {
  const role = value.trim().toUpperCase()
  if (role === 'PARTICIPANT' || role === 'STUDENT' || role === 'INDIVIDUAL') return 'INDIVIDUAL'
  if (role === 'TEACHER' || role === 'INSTRUCTOR') return 'TEACHER'
  return role
}

/**
 * 바인딩 targetRole과 현재 참여 역할이 다르면 목록·제출에서 제외. 역할 없는(untyped) 바인딩은 허용.
 * 기관 신청(ORGANIZATION)은 교사 만족도(TEACHER)와 학생 만족도(INDIVIDUAL)를 같은 신청 타입으로 연다.
 */
export function isPortalFormTargetRoleMismatch(
  targetRole: string | null | undefined,
  applicationType: ProgramApplicationType | null | undefined,
  satisfactionAudience?: EducationSatisfactionAudience | null,
): boolean {
  const role = normalizePortalFormRole(targetRole ?? '')
  if (!role) return false
  const current = normalizePortalFormRole(applicationType ?? '')
  if (!current) return false
  if (current === 'ORGANIZATION') {
    if (satisfactionAudience === 'teacher') {
      return role !== 'TEACHER' && role !== 'ORGANIZATION'
    }
    if (satisfactionAudience === 'student') {
      return role !== 'INDIVIDUAL' && role !== 'ORGANIZATION'
    }
  }
  return role !== current
}
