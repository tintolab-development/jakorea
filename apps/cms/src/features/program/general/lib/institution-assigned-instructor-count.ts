import type { InstructorRoleKey } from '../model/school-detail-types'

/** 참여 기관 목록 등 — 대표강사명 외 N명 (미배정 시 `-`) */
export function formatAssignedInstructorSummary(
  instructors: ReadonlyArray<{ role: InstructorRoleKey; instructorName: string }>
): string {
  if (instructors.length === 0) return '-'
  const lead = instructors.find(i => i.role === 'lead') ?? instructors[0]
  if (instructors.length === 1) return lead.instructorName
  return `${lead.instructorName} 외 ${instructors.length - 1}명`
}

/** `assignedInstructorNames` 표시 문자열에서 배정 강사 수 산출 */
export function countAssignedInstructors(assignedInstructorNames?: string): number {
  const raw = assignedInstructorNames?.trim()
  if (!raw) return 0

  const parts = raw
    .split(/[,、/|]/)
    .map(part => part.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts.length : 1
}
