import type { AdjacentImpactStories } from './adjacent'
import type { ImpactStoryDetail, ImpactStoryListItem } from '../model/types'

export function getImpactStoryListFallback(): ImpactStoryListItem[] {
  return []
}

export function getImpactStoryFeaturedFallback(): ImpactStoryListItem[] {
  return []
}

export function getImpactStoryDetailFallback(_id: string | null): ImpactStoryDetail | null {
  return null
}

export function getImpactStoryAdjacentFallback(_id: string): AdjacentImpactStories {
  return { previous: null, next: null }
}
