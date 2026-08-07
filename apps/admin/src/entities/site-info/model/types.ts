/**
 * 사이트 정보 — 사이트명, SEO(소개글), OG 이미지, 파비콘
 */

export type SiteInfo = {
  siteName: string
  /** Notion: SEO 메타 태그 · 시안: 사이트 소개글 */
  siteDescription: string
  ogImageUrl: string
  ogImageFileName?: string
  faviconUrl: string
  faviconFileName?: string
  updatedAt: string
}

export type SiteInfoSaveInput = Omit<SiteInfo, 'updatedAt'>
