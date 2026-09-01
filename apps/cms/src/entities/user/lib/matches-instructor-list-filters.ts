import type { User } from '@/types/user'
import { getMemberPermissionInstructorApplicationTypeLabel } from '@/features/user/permission-management/lib/member-permission-instructor-application-type'

type UserRow = Omit<User, 'password'>

/** `user-list`의 강사 유형 표시와 동일 — 강사비 등급이 아닌 신청·소속 구분 기준 */
export function getInstructorTypeDisplayLabel(user: UserRow): string {
  const label = getMemberPermissionInstructorApplicationTypeLabel(user)
  return label === '-' ? '' : label
}

export function matchesInstructorTypeFilter(user: UserRow, selected: string): boolean {
  const token = selected.trim()
  if (!token) return true
  if (user.role !== 'INSTRUCTOR') return false
  return getInstructorTypeDisplayLabel(user) === token
}

export function getInstructorSettlementDisplayLabel(user: UserRow): string {
  return user.listMetrics?.settlementStatusLabel?.trim() ?? ''
}

export function matchesInstructorSettlementFilter(user: UserRow, selected: string): boolean {
  const token = selected.trim()
  if (!token) return true
  if (user.role !== 'INSTRUCTOR') return false
  const label = getInstructorSettlementDisplayLabel(user)
  if (token === '해당 없음') {
    return label === '' || label === '-' || label === '해당 없음'
  }
  return label === token
}

/** 필터 value는 `A`|`B`|`C`|`D` — 행 값은 `A` 또는 `A등급` 모두 허용 */
export function matchesInstructorJaEvaluationGradeFilter(
  user: UserRow,
  selected: string
): boolean {
  const token = selected.trim().replace(/등급$/u, '')
  if (!token || token === 'all') return true
  if (user.role !== 'INSTRUCTOR') return false
  const grade = user.listMetrics?.jaEvaluationGrade?.trim().replace(/등급$/u, '') ?? ''
  return grade === token
}
