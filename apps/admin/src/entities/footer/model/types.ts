/**
 * 푸터 관리 도메인
 */

/** 상단 노출 메뉴 — 고정 7행 */
export type FooterTopMenu = {
  id: string
  sortOrder: number
  isActive: boolean
  name: string
  /** true면 조회 시 링크 비어 있으면 "사이트 내부 연결" 표시 (수정 모드는 링크 편집 가능) */
  isInternal: boolean
  linkUrl: string
}

export type FooterTopMenuPatch = {
  id: string
  name: string
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
  updatedAt: string
}

/** 유관기관 로고 — 고정 슬롯 4개 */
export type FooterRelatedLogo = {
  id: string
  sortOrder: number
  isActive: boolean
  /** false면 목록 empty 문구 */
  hasContent: boolean
  name: string
  logoUrl: string
  logoFileName?: string
}

export type FooterRelatedLogoSaveInput = {
  id: string
  isActive: boolean
  name: string
  logoUrl: string
  logoFileName?: string
}
