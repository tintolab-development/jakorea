/**
 * Gemini 찾아가는 연수 — FE 목록 필터 ↔ BE `program.period_status` 와이어.
 *
 * Primary Case(185xxx) SoT: SCHEDULED · RECRUITING · COMPLETED.
 * CMS UI는 신청기간 파생 라벨(SCHEDULED / IN_PROGRESS / ENDED)을 쓴다.
 * `DRAFT`는 draftStatus 축이라 periodStatus 쿼리에 넣지 않는다(`list-remote-filters`의 draftStatus).
 *
 * @see JABACK docs/frontend/gemini-primary-case-seed-handoff-2026-09.md
 */
export function mapGeminiRecruitmentUiStatusToPeriodStatusWire(
  uiStatus: string | null | undefined
): string | undefined {
  const normalized = uiStatus?.trim().toUpperCase()
  if (!normalized || normalized === 'ALL' || normalized === 'DRAFT') return undefined
  if (normalized === 'IN_PROGRESS') return 'RECRUITING'
  if (normalized === 'ENDED') return 'COMPLETED'
  if (normalized === 'SCHEDULED') return 'SCHEDULED'
  if (
    normalized === 'RECRUITING' ||
    normalized === 'COMPLETED' ||
    normalized === 'CANCELLED' ||
    normalized === 'NOT_PROCEEDED'
  ) {
    return normalized
  }
  return undefined
}
