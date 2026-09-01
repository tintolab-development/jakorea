/**
 * 메인 소셜 링크 도메인 타입
 * 관리 채널은 고정 6종 — 신규 추가/삭제 없음
 */

export type SocialLinkChannel =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'naver_blog'
  | 'newsletter'
  | 'youtube'

export type SocialLink = {
  id: string
  channel: SocialLinkChannel
  /** 표시명 (고정, 수정 불가) */
  name: string
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  linkUrl: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
  updatedAt: string
}

export type SocialLinkUrlPatch = {
  id: string
  linkUrl: string
}
