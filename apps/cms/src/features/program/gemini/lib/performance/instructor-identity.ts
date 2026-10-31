/**
 * 연수보고서 강사 신원 — 이름·연락처가 모두 비면「미기재」(실적만 등록 후보).
 * 하나만 있으면「부분 기재」→ BE가 기존처럼 실패시켜야 한다.
 */
export function isGeminiInstructorIdentityBlank(
  instructorName: string | null | undefined,
  contact: string | null | undefined
): boolean {
  const name = instructorName?.trim() ?? ''
  const phoneDigits = (contact ?? '').replace(/\D/g, '')
  return name.length === 0 && phoneDigits.length === 0
}

export function isGeminiInstructorIdentityPartial(
  instructorName: string | null | undefined,
  contact: string | null | undefined
): boolean {
  if (isGeminiInstructorIdentityBlank(instructorName, contact)) return false
  const name = instructorName?.trim() ?? ''
  const phoneDigits = (contact ?? '').replace(/\D/g, '')
  return name.length === 0 || phoneDigits.length === 0
}
