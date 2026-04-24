import type { User } from '@/types/user'

type UserRow = Omit<User, 'password'>

/**
 * 회원 권한 승인 목록「신청 유형」— 회원/소속 구분만 표시 (강사비 등급 등 정산 필드 사용 안 함).
 * API가 `listMetrics.permissionApplicationTypeLabel`을 주면 그대로 사용한다.
 */
export function getMemberPermissionInstructorApplicationTypeLabel(user: UserRow): string {
  const explicit = user.listMetrics?.permissionApplicationTypeLabel?.trim()
  if (explicit) return explicit

  const parts: string[] = []
  const affFirst = user.affiliation?.split('|')[0]?.trim()
  if (affFirst) parts.push(affFirst)
  const career = user.listMetrics?.instructorCareerSummaryLabel?.trim()
  if (career) parts.push(career)
  const haystack = parts.join(' ')

  if (/제미나이/.test(haystack)) return '제미나이 강사단'
  if (/특강|일회성|자유강사/.test(haystack)) return '특강 강사'
  if (/JA\s*강사단|JA\s*강사/.test(haystack)) return 'JA 강사단'

  return '-'
}
