export type StripBanner = {
  id: string
  order: number
  active: boolean
  /** 배너 문구 (최대 80자) */
  text: string
  startDate: string
  endDate: string
  linkEnabled: boolean
  linkUrl: string
  createdAt: string
  updatedAt: string
}

export type StripBannerDraft = {
  active: boolean
  text: string
  startDate: string
  endDate: string
  linkEnabled: boolean
  linkUrl: string
}

export type StripBannerFilters = {
  active: 'all' | 'active' | 'inactive'
  text: string
  startDate: string | null
  endDate: string | null
}

export const STRIP_BANNER_MAX_ACTIVE = 2
export const STRIP_BANNER_TEXT_MAX = 80
