/**
 * 재능기부 소개 관리 — 홈페이지 재능기부 소개 화면 노출 콘텐츠
 */

export type HowItemId = 1 | 2 | 3

export type InterviewSlotId = 'interview_01' | 'interview_02'

export type TalentDonationBanner = {
  imageUrl: string
  imageFileName?: string
  imageAssetId?: number
  mainText: string
  subText: string
  version: number
}

export type HowItem = {
  id: HowItemId
  title: string
  description: string
  version: number
}

export type InterviewSlot = {
  id: InterviewSlotId
  mainText: string
  subText: string
  buttonLabel: string
  linkedStoryId: string | null
  linkedStoryTitle: string
  /** 연결 게시글 썸네일 = 홈페이지 인터뷰 이미지 */
  thumbnailUrl: string
  version: number
}

export type TalentDonationIntroData = {
  banner: TalentDonationBanner
  howItems: HowItem[]
  interviews: InterviewSlot[]
  updatedAt: string
}

export type BannerSaveInput = {
  imageUrl: string
  imageFileName?: string
  imageFile?: File | null
  imageAssetId?: number
  mainText: string
  subText: string
  version: number
}

export type HowSaveItem = {
  id: HowItemId
  title: string
  description: string
  version: number
}

export type InterviewSaveInput = {
  id: InterviewSlotId
  mainText: string
  subText: string
  buttonLabel: string
  linkedStoryId: string | null
  linkedStoryTitle: string
  thumbnailUrl: string
  version: number
}
