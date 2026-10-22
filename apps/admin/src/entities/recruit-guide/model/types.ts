/**
 * 채용 안내 관리 — 홈페이지 채용 화면 노출 콘텐츠
 */

export type CultureItemId = 'ready_to_help' | 'make_an_impact' | 'speak_openly' | 'keep_learning'

export type RecruitGuideBanner = {
  imageUrl: string
  imageFileName?: string
  /** 서버에 보낼 배너 자산 ID. 이미지 제거는 null로 표현한다. */
  imageAssetId?: number | null
  mainText: string
  subText01: string
  subText02: string
  version: number
}

export type CultureItem = {
  id: CultureItemId
  /** 서버 고정 식별자 (1~4) */
  apiId: number
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  title: string
  description: string
  version: number
}

export type InterviewImpactStorySummary = {
  id?: number
  categoryId?: number
  categoryName?: string
  title?: string
  publishAt?: string
  imageUrl?: string | null
  isPublished?: boolean
}

export type InterviewItem = {
  /** 서버 DB의 직무 인터뷰 식별자. 배열 순번이나 1~9 슬롯이 아니다. */
  id: string
  displayOrder: number
  /** 서버가 저장한 실제 임팩트 스토리 ID. 연결이 끊긴 기존 행은 null일 수 있다. */
  impactStoryId: number | null
  /** 호환 조회용 식별자. 저장 요청에는 사용하지 않는다. */
  storyKey?: string
  linkStatus?: string
  impactStory?: InterviewImpactStorySummary | null
  title: string
  publishedYear: number | null
  version: number
  /** Platform 직무 인터뷰 커버. 목록 표에는 제목만 보인다. */
  imageUrl?: string
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
  imageAssetId?: number | null
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
  impactStoryId: number
  title: string
  publishedYear: number | null
}
