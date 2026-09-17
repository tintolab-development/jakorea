import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'

const ACTIVE_ASSIGNMENT_STATUSES = new Set(['ASSIGNED', 'WAITING', 'CONFIRMED', 'ACTIVE'])

function isActiveAssignment(status: string | undefined): boolean {
  const normalized = (status ?? 'ASSIGNED').trim().toUpperCase()
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') return false
  return ACTIVE_ASSIGNMENT_STATUSES.has(normalized) || normalized.length === 0
}

/** 강사 memberId → 배정 기관명(가나다순, 중복 제거) */
export function buildAssignedOrganizationNamesByMemberId(
  assignments: readonly InstructorAssignmentListItemEnriched[]
): Map<string, string[]> {
  const bucket = new Map<string, Set<string>>()

  for (const assignment of assignments) {
    if (assignment.instructorMemberId == null) continue
    if (!isActiveAssignment(assignment.assignmentStatus)) continue
    const orgName = assignment.organizationName?.trim()
    if (!orgName) continue
    const key = String(assignment.instructorMemberId)
    const names = bucket.get(key) ?? new Set<string>()
    names.add(orgName)
    bucket.set(key, names)
  }

  return new Map(
    [...bucket.entries()].map(([memberId, names]) => [
      memberId,
      [...names].sort((a, b) => a.localeCompare(b, 'ko')),
    ])
  )
}
