import type { ImpactStoryListCategory, ImpactStoriesListParams } from '../model/types'
import type { PFTabItem } from '@/shared/ui'

export const IMPACT_STORIES_PATH = '/impact'

export const impactStoryDetailPath = (id: string) => `${IMPACT_STORIES_PATH}/${id}`

export const IMPACT_STORIES_PAGE_SIZE = 9

export const DEFAULT_IMPACT_STORIES_LIST_PARAMS = {
  category: 'all',
  q: '',
  page: 1,
} as const satisfies ImpactStoriesListParams

export const IMPACT_STORY_CATEGORY_TAB_ITEMS: readonly PFTabItem[] = [
  { key: 'all', label: '전체' },
  { key: 'story', label: '스토리' },
  { key: 'press', label: '언론보도' },
  { key: 'report', label: '보고서' },
  { key: 'video', label: '영상' },
  { key: 'newsletter', label: '뉴스레터' },
]

const CATEGORY_KEYS = new Set<ImpactStoryListCategory>([
  'all',
  'story',
  'press',
  'report',
  'video',
  'newsletter',
])

export function isImpactStoryListCategory(value: string): value is ImpactStoryListCategory {
  return CATEGORY_KEYS.has(value as ImpactStoryListCategory)
}

export function getImpactStoryCategoryTabItems(): PFTabItem[] {
  return IMPACT_STORY_CATEGORY_TAB_ITEMS.map(item => ({ ...item }))
}
