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

/** 필터·행 값 정규화 — `JA_A` / `A등급` / `A` → `A`. 미평가(`''`·`-`)는 빈 문자열 */
export function normalizeInstructorJaEvaluationGradeToken(raw: string): string {
  const normalized = raw.trim().replace(/^JA_/i, '').replace(/등급$/u, '').toUpperCase()
  if (!normalized || normalized === '-' || normalized === 'ALL') return ''
  if (normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D') {
    return normalized
  }
  return ''
}

/** 필터 value는 `A`|`B`|`C`|`D` — 행 값은 `A` · `A등급` · `JA_A` 허용. 미평가는 등급 필터에서 제외(전체만 노출) */
export function matchesInstructorJaEvaluationGradeFilter(
  user: UserRow,
  selected: string
): boolean {
  const token = normalizeInstructorJaEvaluationGradeToken(selected)
  if (!token) return true
  if (user.role !== 'INSTRUCTOR') return false
  const grade = normalizeInstructorJaEvaluationGradeToken(
    user.listMetrics?.jaEvaluationGrade ?? ''
  )
  if (!grade) return false
  return grade === token
}
