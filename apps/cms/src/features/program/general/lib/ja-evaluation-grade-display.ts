/** JA 평가 등급 — 테이블·상세 조회 (미평가 시 `-`) */
export function formatJaEvaluationGradeCellDisplay(
  value: string | null | undefined
): string {
  const raw = value?.trim()
  if (!raw) return '-'
  const grade = raw.replace(/^JA_/i, '')
  return grade.endsWith('등급') ? grade : `${grade}등급`
}
