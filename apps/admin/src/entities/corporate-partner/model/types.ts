/**
 * 후원사 목록 — 홈페이지 기업후원 후원사 노출 정보
 */

export type CorporatePartner = {
  id: string
  /** 1-based 노출 순서 */
  sortOrder: number
  isPublic: boolean
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  name: string
  createdAt: string
  updatedAt: string
  version: number
}

export type CorporatePartnerCreateInput = {
  isPublic: boolean
  logoUrl: string
  logoFile?: File
  logoAssetId?: number
  logoFileName?: string
  name: string
  /** 1-based, 범위 1…n+1 */
  sortOrder: number
}

export type CorporatePartnerUpdateInput = {
  isPublic?: boolean
  logoUrl?: string
  logoFile?: File
  logoAssetId?: number
  logoFileName?: string
  name?: string
  /** 1-based, 범위 1…n */
  sortOrder?: number
}

export type CorporatePartnerListFilter = {
  isPublic?: boolean
  name?: string
  /** YYYY-MM-DD */
  registeredFrom?: string
  /** YYYY-MM-DD */
  registeredTo?: string
}

export type CorporatePartnerListResult = {
  items: CorporatePartner[]
  totalCount: number
}
