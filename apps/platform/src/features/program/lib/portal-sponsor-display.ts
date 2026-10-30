/**
 * 공개 프로그램 상세 후원사 — GET /api/portal/programs/{id} 의 sponsorNames[] 만.
 * Gemini 기본값(Google for Education)은 BE Portal read model이 채운다. FE 하드코딩 금지.
 * 목록 DTO에는 sponsorNames 가 없다.
 */
export function mapPortalSponsorDisplay(
  sponsorNames: readonly unknown[] | null | undefined,
): string {
  const names = (sponsorNames ?? [])
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean)
  return names.join(', ') || '-'
}

export function isProgramSponsorVisible(sponsor: string | null | undefined): boolean {
  const trimmed = sponsor?.trim() ?? ''
  return trimmed.length > 0 && trimmed !== '-'
}
