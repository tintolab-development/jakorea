import type { ProgramApplicationType } from '../../applications/api/types'

function normalizePortalFormRole(value: string): string {
  const role = value.trim().toUpperCase()
  if (role === 'PARTICIPANT' || role === 'STUDENT' || role === 'INDIVIDUAL') return 'INDIVIDUAL'
  return role
}

/** 바인딩 targetRole과 현재 참여 역할이 다르면 목록·제출에서 제외. 역할 없는(untyped) 바인딩은 허용. */
export function isPortalFormTargetRoleMismatch(
  targetRole: string | null | undefined,
  applicationType: ProgramApplicationType | null | undefined,
): boolean {
  const role = normalizePortalFormRole(targetRole ?? '')
  if (!role) return false
  const current = normalizePortalFormRole(applicationType ?? '')
  if (!current) return false
  return role !== current
}
