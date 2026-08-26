/**
 * 채용 안내 관리 — 홈페이지 채용 화면 노출 콘텐츠
 */

export type CultureItemId =
  | 'ready_to_help'
  | 'make_an_impact'
  | 'speak_openly'
  | 'keep_learning'

export type RecruitGuideBanner = {
  imageUrl: string
  imageFileName?: string
  imageAssetId?: number
  mainText: string
  subText01: string
  subText02: string
  version: number
}

export type CultureItem = {
  id: CultureItemId
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  title: string
  description: string
  version: number
}

export type InterviewItem = {
  id: string
  storyId: string
  title: string
  publishedYear: number
}

export type RecruitGuideData = {
  banner: RecruitGuideBanner
  cultureItems: CultureItem[]
  interviews: InterviewItem[]
  updatedAt: string
}

export type BannerSaveInput = {
  imageUrl: string
  imageFileName?: string
  imageFile?: File | null
  imageAssetId?: number
  mainText: string
  subText01: string
  subText02: string
  version: number
}

export type CultureSaveItem = {
  id: CultureItemId
  title: string
  description: string
  version: number
}

export type InterviewSaveItem = {
  storyId: string
  title: string
  publishedYear: number
}
