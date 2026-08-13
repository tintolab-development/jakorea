/**
 * 메인 상단 띠배너 도메인 타입
 */

export type StripBanner = {
  id: string
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
  /** 배너 문구 */
  text: string
  /** YYYY-MM-DD */
  periodStart: string
  /** YYYY-MM-DD */
  periodEnd: string
  linkEnabled: boolean
  linkUrl: string
  createdAt: string
  updatedAt: string
}

export type StripBannerCreateInput = {
  isActive: boolean
  text: string
  periodStart: string
  periodEnd: string
  linkEnabled: boolean
  linkUrl: string
}

export type StripBannerUpdateInput = {
  isActive?: boolean
  text?: string
  periodStart?: string
  periodEnd?: string
  linkEnabled?: boolean
  linkUrl?: string
}

export type StripBannerListFilter = {
  /** null/undefined = 전체 */
  isActive?: boolean | null
  text?: string
  /** 게시 기간 필터 시작 (YYYY-MM-DD) */
  periodStart?: string
  /** 게시 기간 필터 종료 (YYYY-MM-DD) */
  periodEnd?: string
}

/** 동시 사용(노출) 가능 최대 개수 */
export const MAX_ACTIVE_STRIP_BANNERS = 2

export class StripBannerActiveLimitError extends Error {
  constructor() {
    super(`배너는 최대 ${MAX_ACTIVE_STRIP_BANNERS}개까지 동시 사용 가능합니다.`)
    this.name = 'StripBannerActiveLimitError'
  }
}
