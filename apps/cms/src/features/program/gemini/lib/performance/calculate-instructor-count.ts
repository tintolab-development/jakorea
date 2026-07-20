/** 보조강사명 콤마(,) 구분 수 + 1 */
export function calculateInstructorCount(assistantInstructorNames: string): number {
  const assistants = assistantInstructorNames
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
  return 1 + assistants.length
}
