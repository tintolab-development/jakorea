export type ImpactStoryCategoryKey =
  | 'story'
  | 'press'
  | 'report'
  | 'video'
  | 'newsletter'

export type ImpactStoryListCategory = 'all' | ImpactStoryCategoryKey

export type ImpactStoryListItem = {
  id: string
  category: ImpactStoryCategoryKey
  categoryLabel: string
  title: string
  summary: string
  /** 표시용 — 예: 2026년 08월 15일 */
  publishedAtLabel: string
  /** 정렬용 ISO */
  publishedAt: string
  isFeatured: boolean
  /** 썸네일 플레이스홀더 배경색 */
  placeholderColor: string
}

/** 본문 블록 — 이미지는 플레이스홀더만 (실제 에셋 없음) */
export type ImpactStoryContentBlock =
  | { type: 'paragraph'; text: string }
  | {
      type: 'image'
      /** CSS aspect-ratio 값 — 예: '16 / 9' */
      aspectRatio?: string
      /** 고정 높이(px). 지정 시 aspect-ratio보다 우선 */
      heightPx?: number
    }

export type ImpactStoryDetail = ImpactStoryListItem & {
  /** 상세 메타용 — 예: 2026년 08월 15일 오전 12:00 */
  publishedAtDetailLabel: string
  viewCount: number
  blocks: ImpactStoryContentBlock[]
}

export type ImpactStoriesListParams = {
  category: ImpactStoryListCategory
  q: string
  page: number
}
