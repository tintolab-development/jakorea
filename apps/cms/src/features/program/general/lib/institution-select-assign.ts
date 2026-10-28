import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import type { Program } from '@/types/domain'

export type AssignmentModalStep = 'select' | 'confirm' | 'submitting' | 'complete'

/** 이전 PermissionModal 기본값(즉시 발송). 확인 모달에서 시점을 받지 않으므로 동일 기본 payload를 유지한다. */
export const INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD: PermissionModalPayload = {
  reason: '',
  notifyTiming: 'immediate',
}

export function resolveRequiredAssignableInstructorCount(program: Program): number | null {
  const value = program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function countAssignedInstructorsForOrganization(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  boardLoaded: boolean
  organizationApplicationId?: string | null
  organizationName?: string | null
}): number | null {
  if (!input.boardLoaded) return null
  const orgAppId = input.organizationApplicationId?.trim() ?? ''
  const orgName = input.organizationName?.trim() ?? ''
  if (!orgAppId && !orgName) return null

  const memberIds = new Set<string>()
  for (const assignment of input.assignments) {
    const status = (assignment.assignmentStatus ?? '').toUpperCase()
    if (status === 'CANCELLED' || status === 'CANCELED') continue
    const rowOrgAppId =
      assignment.organizationApplicationId != null
        ? String(assignment.organizationApplicationId)
        : ''
    const rowName = assignment.organizationName?.trim() ?? ''
    const matchesOrgApp = Boolean(orgAppId) && rowOrgAppId === orgAppId
    const matchesName = !orgAppId && Boolean(orgName) && rowName === orgName
    if (!matchesOrgApp && !matchesName) continue
    if (assignment.instructorMemberId == null) continue
    memberIds.add(String(assignment.instructorMemberId))
  }
  return memberIds.size
}

export function formatAssignedInstructorCountLine(
  currentCount: number | null,
  requiredCount: number | null
): string | null {
  if (currentCount == null || requiredCount == null) return null
  return `(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}
