import type { ImpactStoryListCategory, ImpactStoriesListParams } from '../model/types'
import type { PFTabItem } from '@/shared/ui'
import { IMPACT_STORY_CATEGORY_LABEL } from './category'

export {
  IMPACT_STORY_CATEGORY_LABEL,
  IMPACT_STORY_PLACEHOLDER_COLORS,
  categoryIdFromKey,
  categoryKeyFromName,
  parsePublicStoryId,
} from './category'

export const IMPACT_STORIES_PATH = '/impact'

export const impactStoryDetailPath = (id: string) => `${IMPACT_STORIES_PATH}/${id}`

export { IMPACT_STORY_PIN_MAX } from './pin-max'

export const IMPACT_STORIES_PAGE_SIZE = 9

/**
 * GET /api/public/impact-story/stories?page=0&size=20
 * 고정글(최대 9)과 인접글·홈 서브카드용 미리보기. 그리드(size=9)와 섞지 않는다.
 */
export const IMPACT_STORIES_PREVIEW_SIZE = 20

export const DEFAULT_IMPACT_STORIES_LIST_PARAMS = {
  category: 'all',
  q: '',
  page: 1,
} as const satisfies ImpactStoriesListParams

export const IMPACT_STORY_CATEGORY_TAB_ITEMS: readonly PFTabItem[] = [
  { key: 'all', label: '전체' },
  { key: 'story', label: IMPACT_STORY_CATEGORY_LABEL.story },
  { key: 'press', label: IMPACT_STORY_CATEGORY_LABEL.press },
  { key: 'report', label: IMPACT_STORY_CATEGORY_LABEL.report },
  { key: 'video', label: IMPACT_STORY_CATEGORY_LABEL.video },
  { key: 'newsletter', label: IMPACT_STORY_CATEGORY_LABEL.newsletter },
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
