/**
 * 메인 팝업 도메인 타입
 */

export type Popup = {
  id: string
  /** 1-based 홈 노출 순서 */
  sortOrder: number
  isActive: boolean
  imageUrl: string
  imageFileName?: string
  name: string
  altText: string
  /** YYYY-MM-DD */
  periodStart: string
  /** YYYY-MM-DD */
  periodEnd: string
  linkEnabled: boolean
  linkUrl: string
  createdAt: string
  updatedAt: string
}

export type PopupCreateInput = {
  isActive: boolean
  imageUrl: string
  imageFileName?: string
  name: string
  altText: string
  periodStart: string
  periodEnd: string
  linkEnabled: boolean
  linkUrl: string
}

export type PopupUpdateInput = {
  isActive?: boolean
  imageUrl?: string
  imageFileName?: string
  name?: string
  altText?: string
  periodStart?: string
  periodEnd?: string
  linkEnabled?: boolean
  linkUrl?: string
}

export type PopupListFilter = {
  /** null/undefined = 전체 */
  isActive?: boolean | null
  name?: string
  altText?: string
  /** 게시 기간 필터 시작 (YYYY-MM-DD) */
  periodStart?: string
  /** 게시 기간 필터 종료 (YYYY-MM-DD) */
  periodEnd?: string
}

/** 동시 사용(노출) 가능 최대 개수 */
export const MAX_ACTIVE_POPUPS = 4

export class PopupActiveLimitError extends Error {
  constructor() {
    super(`팝업은 최대 ${MAX_ACTIVE_POPUPS}개까지 동시 사용 가능합니다.`)
    this.name = 'PopupActiveLimitError'
  }
}
