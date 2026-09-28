import type { ImpactStoryListItem } from '../model/types'

export type AdjacentImpactStories = {
  previous: ImpactStoryListItem | null
  next: ImpactStoryListItem | null
}

/**
 * 최신순(발행일 desc) 기준 인접 글.
 * - previous(이전글): 목록에서 아래(더 오래된) 글
 * - next(다음글): 목록에서 위(더 최근) 글
 */
export function getAdjacentFromStories(
  stories: readonly ImpactStoryListItem[],
  id: string
): AdjacentImpactStories {
  const sorted = [...stories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const index = sorted.findIndex(item => item.id === id)
  if (index < 0) {
    return { previous: null, next: null }
  }
  return {
    next: index > 0 ? (sorted[index - 1] ?? null) : null,
    previous: index < sorted.length - 1 ? (sorted[index + 1] ?? null) : null,
  }
}
