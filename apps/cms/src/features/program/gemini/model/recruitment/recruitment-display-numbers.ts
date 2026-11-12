import type { GeminiRecruitmentRow } from './types'

/** 최신순으로 정렬하고 displayNo를 위에서부터 1, 2, 3…(오름차순)으로 재부여한다. 미게시(DRAFT) 행은 항상 최상단. */
export function assignRecruitmentDisplayNumbers(
  rows: GeminiRecruitmentRow[]
): GeminiRecruitmentRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.isDraft && !b.isDraft) return -1
    if (!a.isDraft && b.isDraft) return 1
    return b.id.localeCompare(a.id)
  })

  return sorted.map((row, index) => ({
    ...row,
    displayNo: index + 1,
  }))
}
