export type UjatEducationProgressSummaryCopy = {
  year: number | null
  firstHalfTerm: string | null
  secondHalfTerm: string | null
}

/** GET 기수 문자열만 사용. 회차 커리큘럼에서 파싱하지 않는다. */
export function normalizeSummaryActivityTerm(
  raw: string | null | undefined
): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  return trimmed.replace(/기$/u, '') || null
}

export function copyFromEducationProgressSummaryResponse(response: {
  programYear?: number | null
  firstHalfActivityTerm?: string | null
  secondHalfActivityTerm?: string | null
}): UjatEducationProgressSummaryCopy {
  return {
    year: typeof response.programYear === 'number' ? response.programYear : null,
    firstHalfTerm: normalizeSummaryActivityTerm(response.firstHalfActivityTerm),
    secondHalfTerm: normalizeSummaryActivityTerm(response.secondHalfActivityTerm),
  }
}

export function schoolSemesterGroupLabel(
  kind: 'h1' | 'h2' | 'grand',
  year: number | null
): string {
  if (kind === 'h1') return '1학기'
  if (kind === 'h2') return '2학기'
  return year != null ? `${year}년 종합` : '종합'
}

export function volunteerPassRowLabel(
  kind: 'h1' | 'h2',
  term: string | null
): string {
  if (term) return `${term}기 최종 합격`
  return kind === 'h1' ? '1학기 최종 합격' : '2학기 최종 합격'
}

export function volunteerFinalRowLabel(year: number | null): string {
  return year != null ? `${year} 봉사단 최종 인원` : '봉사단 최종 인원'
}

export const UJAT_EDU_PROGRESS_PLANNED_SELECTION_LABEL = '선발 예정 인원'
