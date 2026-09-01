/**
 * 홈 섹션 mock 데이터 — 실제 에셋·API 연동 시 이 파일만 교체.
 */

import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import partnerLogo01Url from '@/features/corporate-donation/image/partner-logo-01.svg'
import partnerLogo02Url from '@/features/corporate-donation/image/partner-logo-02.svg'
import partnerLogo03Url from '@/features/corporate-donation/image/partner-logo-03.svg'
import partnerLogo04Url from '@/features/corporate-donation/image/partner-logo-04.svg'
import partnerLogo05Url from '@/features/corporate-donation/image/partner-logo-05.svg'
import partnerLogo06Url from '@/features/corporate-donation/image/partner-logo-06.svg'
import partnerLogo07Url from '@/features/corporate-donation/image/partner-logo-07.svg'
import partnerLogo08Url from '@/features/corporate-donation/image/partner-logo-08.svg'
import partnerLogo09Url from '@/features/corporate-donation/image/partner-logo-09.svg'
import partnerLogo10Url from '@/features/corporate-donation/image/partner-logo-10.svg'
import partnerLogo11Url from '@/features/corporate-donation/image/partner-logo-11.svg'
import partnerLogo12Url from '@/features/corporate-donation/image/partner-logo-12.svg'
import heroClassroomUrl from '../image/background/hero-classroom.png'

export type HomeHeroSlide = {
  id: string
  eyebrow: string
  titleLines: readonly string[]
  description: string
  /** 실제 히어로 사진 수급 전 CSS 배경 placeholder */
  placeholderBackground: string
  /** 에셋 수급 후 채우면 배경 이미지로 사용 */
  imageUrl?: string
}

export const HOME_HERO_AUTOPLAY_MS = 5000

/** TODO: 슬라이드별 히어로 사진 수급 전 임시 공통 이미지 */
const TEMP_HERO_IMAGE_URL = heroClassroomUrl

export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {
    id: 'hero-1',
    eyebrow: 'JA KOREA',
    titleLines: ['청소년의 가능성이', '더 넓은 세상과 만납니다'],
    description: 'JA는 학생들이 멘토와 연결되어 실제 세상을 경험하며 배울 수 있는 교육 기회를 제공합니다.',
    placeholderBackground:
      'linear-gradient(115deg, #16323c 0%, #22404d 45%, #285f74 100%)',
    imageUrl: TEMP_HERO_IMAGE_URL,
  },
  {
    id: 'hero-2',
    eyebrow: 'JA KOREA',
    titleLines: ['경제교육으로 여는', '청소년의 내일'],
    description: '전국 200여 개 지역에서 전문 봉사자·교사·강사가 청소년의 배움과 함께합니다.',
    placeholderBackground:
      'linear-gradient(115deg, #1c3a46 0%, #285f74 55%, #01a1af 130%)',
    imageUrl: TEMP_HERO_IMAGE_URL,
  },
  {
    id: 'hero-3',
    eyebrow: 'JA KOREA',
    titleLines: ['배움의 기회를', '모든 청소년에게'],
    description: '기업과 지역사회가 함께 만드는 실질적인 경제·금융·진로 교육을 경험해 보세요.',
    placeholderBackground:
      'linear-gradient(115deg, #22404d 0%, #337791 60%, #46b17b 140%)',
    imageUrl: TEMP_HERO_IMAGE_URL,
  },
]

export const HOME_YOUTUBE_URL = 'https://www.youtube.com/watch?v=ts_hit5wXqg'

export type HomeAchievementStat = {
  label: string
  value: string
  unit: string
}

export const HOME_ACHIEVEMENT_STATS: readonly HomeAchievementStat[] = [
  { label: '전국 교육 네트워크 분포', value: '200', unit: '지역+' },
  { label: '전문 협업 학교, 기관, 단체', value: '1000', unit: '개+' },
  { label: '전문 봉사자,교사, 강사', value: '3000', unit: '명+' },
]

export const HOME_ACHIEVEMENT_HIGHLIGHT: HomeAchievementStat = {
  label: '교육 수혜자 청소년들의 수',
  value: '90,000',
  unit: '여명',
}

export type HomePartnerLogo = {
  name: string
  /** 로고 이미지 수급 후 채우면 텍스트 대신 이미지 렌더 */
  logoUrl?: string
}

/** 후원사 로고 2줄 롤링 — 윗줄/아랫줄 */
export const HOME_PARTNER_LOGO_ROWS: readonly (readonly HomePartnerLogo[])[] = [
  [
    { name: 'SAMSUNG', logoUrl: partnerLogo01Url },
    { name: 'citi', logoUrl: partnerLogo02Url },
    { name: 'IBM', logoUrl: partnerLogo03Url },
    { name: 'Google for Education', logoUrl: partnerLogo04Url },
    { name: 'KRAFTON', logoUrl: partnerLogo05Url },
    { name: 'lululemon', logoUrl: partnerLogo06Url },
  ],
  [
    { name: '신한은행', logoUrl: partnerLogo07Url },
    { name: 'KYOBO 교보생명', logoUrl: partnerLogo08Url },
    { name: 'MetLife Foundation', logoUrl: partnerLogo09Url },
    { name: 'BNY', logoUrl: partnerLogo10Url },
    { name: 'KIC 한국투자공사', logoUrl: partnerLogo11Url },
    { name: 'Standard Chartered Foundation', logoUrl: partnerLogo12Url },
  ],
]

export function getHomeAchievementStats(): readonly HomeAchievementStat[] {
  if (!shouldUsePlatformMockData()) return []
  return HOME_ACHIEVEMENT_STATS
}

export function getHomeAchievementHighlight(): HomeAchievementStat | null {
  if (!shouldUsePlatformMockData()) return null
  return HOME_ACHIEVEMENT_HIGHLIGHT
}
