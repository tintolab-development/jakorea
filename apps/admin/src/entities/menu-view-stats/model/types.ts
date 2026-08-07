/**
 * 메뉴별 조회 통계
 */

export type MenuViewTabId =
  | 'ja-korea'
  | 'impact'
  | 'education'
  | 'participate'
  | 'sponsor'

export type MenuViewPeriod = {
  from: string
  to: string
}

export type MenuViewSummary = {
  jaKorea: number
  impact: number
  education: number
  participate: number
  sponsor: number
  /** 5개 상위 메뉴 합 (= 표시 총 조회수 합계) */
  total: number
}

/** 대메뉴(1depth 진입) 조회수만 */
export type SimpleEntryMetric = {
  kind: 'simple'
  entryViews: number
}

/** 대메뉴 + 게시글 총 조회수 */
export type EntryAndPostsMetric = {
  kind: 'entry-posts'
  entryViews: number
  postViews: number
}

/** 미사용 메뉴 */
export type DisabledMetric = {
  kind: 'disabled'
  message: string
}

export type TransparencySubRow = {
  id: string
  label: string
  viewCount: number
  /** 없으면 해당 행에 게시글 열 미노출(국세청) */
  postViewCount?: number
  /** 이동자 수 집계 (라벨에 (이동) 등) */
  isRedirect?: boolean
}

/** 투명경영: 대메뉴 rowspan + 중메뉴 행 */
export type TransparencyMetric = {
  kind: 'transparency'
  entryViews: number
  midRows: TransparencySubRow[]
}

export type MenuViewMetric =
  | SimpleEntryMetric
  | EntryAndPostsMetric
  | DisabledMetric
  | TransparencyMetric

export type MenuViewSection = {
  id: string
  title: string
  /** 섹션 상단 안내 (국세청/온라인학습 등) */
  footnote?: string
  metric: MenuViewMetric
}

export type MenuViewStatsResult = {
  period: MenuViewPeriod
  summary: MenuViewSummary
  sectionsByTab: Record<MenuViewTabId, MenuViewSection[]>
}

export const MENU_VIEW_TAB_IDS: readonly MenuViewTabId[] = [
  'ja-korea',
  'impact',
  'education',
  'participate',
  'sponsor',
] as const

export const MENU_VIEW_TAB_LABELS: Record<MenuViewTabId, string> = {
  'ja-korea': 'JA Korea',
  impact: '임팩트 스토리',
  education: '교육 소개',
  participate: '참여하기',
  sponsor: '후원하기',
}

export const DISABLED_MENU_MESSAGE = '해당 메뉴는 미사용 중입니다.'

export const NTS_FOOTNOTE =
  '* 국세청 공시는 조회수 대신 사이트 이동자 수를 카운트합니다.'

export const ONLINE_LEARNING_FOOTNOTE =
  '* 온라인 학습은 조회수 대신 사이트 이동자 수를 카운트합니다.'

export const ALUMNI_FOOTNOTE =
  '* Alumni는 조회수 대신 사이트 이동자 수를 카운트합니다.'
