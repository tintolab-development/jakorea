/**
 * 사이트 정보 — 사이트명, SEO(소개글), OG 이미지, 파비콘
 */

export type SiteInfo = {
  siteName: string
  /** Notion: SEO 메타 태그 · 시안: 사이트 소개글 */
  siteDescription: string
  ogImageUrl: string
  ogImageFileName?: string
  /** Homepage asset id (remote). mock에서는 없을 수 있음 */
  ogAssetId?: number
  faviconUrl: string
  faviconFileName?: string
  faviconAssetId?: number
  updatedAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type SiteInfoSaveInput = {
  siteName: string
  siteDescription: string
  ogImageUrl: string
  ogImageFileName?: string
  ogAssetId?: number
  /** remote: 새 OG 이미지 File (submit 시 upload). mock은 data URL */
  ogImageFile?: File | null
  faviconUrl: string
  faviconFileName?: string
  faviconAssetId?: number
  faviconFile?: File | null
}
