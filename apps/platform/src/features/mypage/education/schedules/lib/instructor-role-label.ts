const MISSING = '-'

/** 배정 역할. 원시 코드(LEAD/ASSISTANT)는 노출하지 않는다. */
export function formatGeminiInstructorRoleLabel(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) return MISSING
  const normalized = value.toUpperCase()
  if (normalized === 'LEAD' || normalized === 'MAIN' || value === '주강사') return '주강사'
  if (
    normalized === 'ASSISTANT' ||
    normalized === 'ASSIST' ||
    value === '보조강사'
  ) {
    return '보조강사'
  }
  return MISSING
}
