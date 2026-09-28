import type { CareerJobListItem } from '../model/types'

export type AdjacentCareerPostings = {
  previous: CareerJobListItem | null
  next: CareerJobListItem | null
}

/**
 * 게시일 desc 가 이미 반영된 공개 목록 기준 인접 글.
 * - previous(이전글): 목록에서 아래(더 오래된) 글
 * - next(다음글): 목록에서 위(더 최근) 글
 */
export function getAdjacentCareerPostings(
  jobs: readonly CareerJobListItem[],
  id: string,
): AdjacentCareerPostings {
  const index = jobs.findIndex(item => item.id === id)
  if (index < 0) {
    return { previous: null, next: null }
  }
  return {
    next: index > 0 ? (jobs[index - 1] ?? null) : null,
    previous: index < jobs.length - 1 ? (jobs[index + 1] ?? null) : null,
  }
}
