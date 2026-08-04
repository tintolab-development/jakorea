export type MainPopup = {
  id: string
  order: number
  active: boolean
  imageUrl: string
  imageName?: string
  name: string
  altText: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  linkEnabled: boolean
  linkUrl: string
  /** 등록일시 ISO — 수정 시 고정 */
  createdAt: string
  updatedAt: string
}

export type MainPopupDraft = {
  active: boolean
  imageUrl: string
  imageName?: string
  name: string
  altText: string
  startDate: string
  endDate: string
  linkEnabled: boolean
  linkUrl: string
}

export type MainPopupFilters = {
  active: 'all' | 'active' | 'inactive'
  name: string
  altText: string
  startDate: string | null
  endDate: string | null
}

export const MAIN_POPUP_MAX_ACTIVE = 4
export const MAIN_POPUP_IMAGE_MAX_BYTES = 15 * 1024 * 1024
export const MAIN_POPUP_IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'
export const MAIN_POPUP_IMAGE_HINT = 'JPG, PNG / 최대 15MB / 권장 1920×1080'
