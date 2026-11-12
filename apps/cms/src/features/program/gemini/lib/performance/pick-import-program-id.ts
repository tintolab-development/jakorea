export type GeminiImportProgramCandidate = {
  programId?: number | null
  draftStatus?: string | null
  periodStatus?: string | null
  businessYear?: number | null
  updatedAt?: string | null
}

const PERIOD_RANK: Record<string, number> = {
  RECRUITING: 0,
  IN_PROGRESS: 0,
  SCHEDULED: 1,
  COMPLETED: 2,
  ENDED: 2,
}

/**
 * 연수보고서 import는 `programId`가 필수다.
 * 진행 중·최신 사업연도 공고를 고른다. 미게시 공고만 있으면 그중에서 고른다.
 */
export function pickGeminiImportProgramId(
  items: GeminiImportProgramCandidate[]
): number | undefined {
  const withId = items.filter(
    (item): item is GeminiImportProgramCandidate & { programId: number } =>
      typeof item.programId === 'number' && Number.isFinite(item.programId)
  )
  const published = withId.filter(item => item.draftStatus !== 'DRAFT')
  const pool = published.length > 0 ? published : withId
  const sorted = [...pool].sort((a, b) => {
    const year = (b.businessYear ?? 0) - (a.businessYear ?? 0)
    if (year !== 0) return year
    const period =
      (PERIOD_RANK[a.periodStatus ?? ''] ?? 9) - (PERIOD_RANK[b.periodStatus ?? ''] ?? 9)
    if (period !== 0) return period
    return String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
  })
  return sorted[0]?.programId
}
