import type { EducationLevelKey } from '@/shared/lib'

export type TextbookThemeKey = 'career' | 'economy' | 'entrepreneurship' | 'digital'

export type TextbookCategoryFilter = 'all' | TextbookThemeKey

export type TextbookSort = 'latest' | 'name'

export type TextbooksListParams = {
  category: TextbookCategoryFilter
  sort: TextbookSort
  page: number
}

export type TextbookTag = {
  label: string
  /** optional icon key for modal chips */
  icon?: 'target' | 'category' | 'skill'
}

export type TextbookUnit = {
  /** n단원 — 예: 1단원 (`bd-sm-rg` + primary) */
  unitLabel?: string
  /** 단원소개 타이틀 (`bd-sm-sb` + primary) */
  title: string
  description: string
}

export type TextbookContent = {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  /**
   * 목록 카드 썸네일(QA-0495) — 233×320 변형을 `src`, 466×640을 2x `srcSet`로 쓴다.
   * 변형이 둘 다 없으면 없음 → 카드는 `thumbnailUrl`을 쓴다.
   */
  listThumbnail?: { src: string; srcSet?: string }
  theme: TextbookThemeKey
  level: EducationLevelKey
  /** 구성 종류 — 있을 때만 목록에 「구성」행 노출 */
  compositions?: string[]
  /** 목록 카드용 태그 라벨 */
  tags: string[]
  /** 모달 상단 칩 */
  modalTags: TextbookTag[]
  /** 모달·목록 공통 요약 — 예: 총 4단원 (30분 수업기준 4차시 교육) */
  sessionSummary: string
  /** 목록 우측 「총 n단원」 */
  unitCount: number
  /** 목록 우측 차시 상세 — 예: 30분 수업기준 4차시 교육 */
  unitSessionText?: string
  /** 공개 상세 `unitIntroHtml`. 있으면 모달 단원 소개 */
  unitIntroHtml?: string
  /** 사업분야 설명 — 디렉터리 문단 */
  fieldDescription?: string
  units: TextbookUnit[]
}

export type DirectoryRow = {
  id: string
  /** 점(·)으로 구분되는 제목들 */
  titles: string[]
  level: EducationLevelKey
  /** 클릭 시 상세 모달에 연결할 콘텐츠 id */
  contentId?: string
}

export type TextbookThemeSection = {
  key: TextbookThemeKey
  title: string
  description: string
  rows: DirectoryRow[]
}
