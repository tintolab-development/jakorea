import type { ImpactStoryCategoryKey, ImpactStoryListCategory } from '../model/types.ts'

export const IMPACT_STORY_CATEGORY_LABEL: Record<ImpactStoryCategoryKey, string> = {
  story: '스토리',
  press: '언론보도',
  report: '보고서',
  video: '영상',
  newsletter: '뉴스레터',
}

const CATEGORY_KEY_BY_LABEL: Record<string, ImpactStoryCategoryKey> = {
  스토리: 'story',
  언론보도: 'press',
  보고서: 'report',
  영상: 'video',
  뉴스레터: 'newsletter',
}

export const IMPACT_STORY_PLACEHOLDER_COLORS: Record<ImpactStoryCategoryKey, string> = {
  story: '#c5e8eb',
  press: '#c8d4e8',
  report: '#d0d5e0',
  video: '#c9dfe8',
  newsletter: '#c5e0f0',
}

export function categoryKeyFromName(name: string | undefined): ImpactStoryCategoryKey {
  if (!name) return 'story'
  return CATEGORY_KEY_BY_LABEL[name.trim()] ?? 'story'
}

export function categoryIdFromKey(
  categories: readonly { id: number; name: string }[],
  key: ImpactStoryListCategory
): number | undefined {
  if (key === 'all') return undefined
  const label = IMPACT_STORY_CATEGORY_LABEL[key]
  const found = categories.find(item => item.name.trim() === label)
  return found?.id
}

/** 공개 상세 경로 id. 숫자만 허용. 구 mock slug(`impact-1`)는 null. */
export function parsePublicStoryId(value: string | null | undefined): number | null {
  if (!value) return null
  if (!/^\d+$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
