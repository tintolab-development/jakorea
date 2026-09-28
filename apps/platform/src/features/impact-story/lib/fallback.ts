/**
 * 공개 임팩트 스토리 API 실패·미호출 시 Platform mock 18건.
 */

import { getAdjacentImpactStories, getFeaturedImpactStories, getMockImpactStories, getMockImpactStoryDetailById } from './mock-stories'
import type { AdjacentImpactStories } from './adjacent'

export function getImpactStoryListFallback() {
  return getMockImpactStories()
}

export function getImpactStoryFeaturedFallback() {
  return getFeaturedImpactStories()
}

export function getImpactStoryDetailFallback(id: string | null) {
  if (!id) return null
  return getMockImpactStoryDetailById(id)
}

export function getImpactStoryAdjacentFallback(id: string): AdjacentImpactStories {
  return getAdjacentImpactStories(id)
}
