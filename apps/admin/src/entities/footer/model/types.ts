/**
 * 푸터 관리 도메인
 */

/** 상단 노출 메뉴 — 고정 7행 */
export type FooterTopMenu = {
  id: string
  sortOrder: number
  isActive: boolean
  name: string
  /** true면 조회 시 링크 비어 있으면 "사이트 내부 연결" 표시 (수정 모드는 EXTERNAL만 링크 편집) */
  isInternal: boolean
  linkUrl: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type FooterTopMenuPatch = {
  id: string
  /** local only — remote PUT은 label 미지원 */
  name?: string
  linkUrl: string
}

/** 기관 정보 */
export type FooterOrgInfo = {
  name: string
  address: string
  zipCode: string
  representative: string
  businessNumber: string
  phone: string
  fax: string
  email: string
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  updatedAt: string
  version: number
}

export type FooterOrgInfoSaveInput = {
  name: string
  address: string
  zipCode: string
  representative: string
  businessNumber: string
  phone: string
  fax: string
  email: string
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  logoFile?: File | null
}

/** 유관기관 로고 — 고정 슬롯 4개 */
export type FooterRelatedLogo = {
  id: string
  /** API partnerId (1–4). mock도 동일 */
  partnerId: number
  sortOrder: number
  isActive: boolean
  /** false면 목록 empty 문구 */
  hasContent: boolean
  name: string
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  version: number
}

export type FooterRelatedLogoSaveInput = {
  id: string
  isActive: boolean
  name: string
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  logoFile?: File | null
}

/** remote GET bundle / 공유 캐시 */
export type FooterAdminDoc = {
  topMenus: FooterTopMenu[]
  orgInfo: FooterOrgInfo
  relatedLogos: FooterRelatedLogo[]
}
