import type { GeminiRecruitmentRow } from './types'

/** displayNo를 최신순(내림차순)으로 재부여한다. 임시저장 행은 항상 최상단. */
export function assignRecruitmentDisplayNumbers(
  rows: GeminiRecruitmentRow[]
): GeminiRecruitmentRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.isDraft && !b.isDraft) return -1
    if (!a.isDraft && b.isDraft) return 1
    return b.id.localeCompare(a.id)
  })

  const total = sorted.length
  return sorted.map((row, index) => ({
    ...row,
    displayNo: total - index,
  }))
}
