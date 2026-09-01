/**
 * 메인 히어로 배너 도메인 타입
 */

export type HeroBanner = {
  id: string
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  /** 미리보기·목록 썸네일 URL (data URL / public URL) */
  imageUrl: string
  imageFileName?: string
  /** Homepage asset id (remote). mock에서는 없을 수 있음 */
  imageAssetId?: number
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
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
  /** remote create: 업로드된 asset id. mock은 imageUrl만 사용 */
  imageAssetId?: number
  /** remote: 새 이미지 File (submit 시 upload). mock은 data URL */
  imageFile?: File | null
  topText: string
  mainTitle: string
  bottomText: string
  linkUrl: string
}

export type HeroBannerUpdateInput = {
  isActive?: boolean
  imageUrl?: string
  imageFileName?: string
  imageAssetId?: number
  imageFile?: File | null
  topText?: string
  mainTitle?: string
  bottomText?: string
  linkUrl?: string
}
