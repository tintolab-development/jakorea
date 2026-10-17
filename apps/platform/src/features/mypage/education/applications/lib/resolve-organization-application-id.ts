/** Portal `organization-applications` path id — 교육현황 상세 `:applicationId`와 동일(숫자). */
export function resolveOrganizationApplicationId(applicationId: string | null | undefined): string | null {
  const trimmed = applicationId?.trim() ?? ''
  if (!/^\d+$/.test(trimmed)) return null
  return trimmed
}
