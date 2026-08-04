export type HeroBanner = {
  id: string
  /** 노출 순서 (0-based, 목록 정렬 기준) */
  order: number
  /** 사용 여부 — true만 홈페이지 히어로에 노출 */
  active: boolean
  imageUrl: string
  /** 파일명 (미리보기용, mock) */
  imageName?: string
  topText: string
  mainTitle: string
  bottomText: string
  linkUrl: string
  updatedAt: string
}

export type HeroBannerDraft = {
  active: boolean
  imageUrl: string
  imageName?: string
  topText: string
  mainTitle: string
  bottomText: string
  linkUrl: string
}

export const HERO_BANNER_IMAGE_MAX_BYTES = 15 * 1024 * 1024
export const HERO_BANNER_IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'
export const HERO_BANNER_IMAGE_HINT = 'JPG, PNG / 최대 15MB / 권장 1920×1080'
