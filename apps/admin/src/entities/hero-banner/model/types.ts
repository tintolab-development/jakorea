/**
 * 메인 히어로 배너 도메인 타입
 */

export type HeroBanner = {
  id: string
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  /** 미리보기·목록 썸네일 URL (data URL / 시드 URL) */
  imageUrl: string
  imageFileName?: string
  topText: string
  mainTitle: string
  bottomText: string
  linkUrl: string
  createdAt: string
  updatedAt: string
}

export type HeroBannerCreateInput = {
  isActive: boolean
  imageUrl: string
  imageFileName?: string
  topText: string
  mainTitle: string
  bottomText: string
  linkUrl: string
}

export type HeroBannerUpdateInput = {
  isActive?: boolean
  imageUrl?: string
  imageFileName?: string
  topText?: string
  mainTitle?: string
  bottomText?: string
  linkUrl?: string
}
