export type SocialChannelId =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'naver-blog'
  | 'newsletter'
  | 'youtube'

export type SocialLink = {
  id: SocialChannelId
  order: number
  active: boolean
  /** 채널명 — 고정, 수정 불가 */
  name: string
  linkUrl: string
}

export const SOCIAL_CHANNEL_DEFS: ReadonlyArray<{
  id: SocialChannelId
  name: string
}> = [
  { id: 'instagram', name: '인스타그램' },
  { id: 'facebook', name: '페이스북' },
  { id: 'linkedin', name: '링크드인' },
  { id: 'naver-blog', name: '네이버 블로그' },
  { id: 'newsletter', name: '뉴스레터' },
  { id: 'youtube', name: '유튜브' },
]
