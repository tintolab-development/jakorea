/**
 * JA Worldwide — Notion 1-3
 * 국가·지역명 고정, 연결 링크·안내 문구만 수정
 */

export type WorldwideRegionId =
  | 'americas'
  | 'europe'
  | 'africa'
  | 'middle-east'
  | 'asia-pacific'
  | 'china'
  | 'japan'
  | 'korea'

export type WorldwideRegion = {
  id: WorldwideRegionId
  /** 고정 — 수정 불가 */
  name: string
  linkUrl: string
}

export type WorldwideContent = {
  regions: WorldwideRegion[]
  /** 하단 안내 문구 */
  notice: string
}

export const WORLDWIDE_REGION_DEFS: ReadonlyArray<{
  id: WorldwideRegionId
  name: string
}> = [
  { id: 'americas', name: 'Americas' },
  { id: 'europe', name: 'Europe' },
  { id: 'africa', name: 'Africa' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'asia-pacific', name: 'Asia Pacific' },
  { id: 'china', name: 'China' },
  { id: 'japan', name: 'Japan' },
  { id: 'korea', name: 'Korea' },
]

export function cloneWorldwideContent(content: WorldwideContent): WorldwideContent {
  return structuredClone(content)
}
