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
