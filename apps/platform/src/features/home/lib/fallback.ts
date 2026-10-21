/**
 * 홈 공개 API 실패·빈 응답 시 쓰는 기본 화면 SSOT.
 * 카피·에셋은 `lib/home-fallback-content.ts` + 레이아웃 상수와 동일하다.
 */

import { CORPORATE_DONATION_PATH } from '@/features/corporate-donation'
import { INDIVIDUAL_DONATION_PATH } from '@/features/individual-donation'
import snsFacebookUrl from '@/shared/assets/icons/sns-facebook.svg'
import snsInstagramUrl from '@/shared/assets/icons/sns-instagram.svg'
import snsLinkedinUrl from '@/shared/assets/icons/sns-linkedin.svg'
import snsMailUrl from '@/shared/assets/icons/sns-mail.svg'
import snsNaverBlogUrl from '@/shared/assets/icons/sns-naver-blog.svg'
import snsYoutubeUrl from '@/shared/assets/icons/sns-youtube.svg'
import cardMinjaeUrl from '@/features/impact-story/image/illustration/card-minjae.png'
import {
  HOME_ACHIEVEMENT_HIGHLIGHT,
  HOME_ACHIEVEMENT_STATS,
  HOME_HERO_SLIDES,
  HOME_PARTNER_LOGO_ROWS,
  HOME_YOUTUBE_URL,
} from './home-fallback-content'
import {
  FALLBACK_DONATION_TITLE,
  FALLBACK_EDUCATION_TITLE,
  FALLBACK_IMPACT_TITLE,
  FALLBACK_PERFORMANCE_TITLE,
  FALLBACK_STRIP_COLORS,
  type HomeMainFallback,
} from './view'

export const HOME_MAIN_FALLBACK: HomeMainFallback = {
  strips: [
    {
      id: 'volunteer',
      label: '경제교육 봉사자 모집 중',
      href: '/programs',
      backgroundColor: FALLBACK_STRIP_COLORS[0],
      external: false,
    },
    {
      id: 'annual-report',
      label: '2026연차보고서가 발간되었습니다 !',
      href: '/about/transparency/annual-reports',
      backgroundColor: FALLBACK_STRIP_COLORS[1],
      external: false,
    },
  ],
  heroes: HOME_HERO_SLIDES,
  educationTitle: FALLBACK_EDUCATION_TITLE,
  programs: [],
  youtubeUrl: HOME_YOUTUBE_URL,
  impactTitle: FALLBACK_IMPACT_TITLE,
  featuredStory: {
    id: 'impact-2',
    category: 'story',
    categoryLabel: '스토리',
    title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
    summary: '',
    publishedAtLabel: '2026년 01월 15일',
    publishedAt: '2026-01-15T12:00:00Z',
    isFeatured: true,
    placeholderColor: '#c5e8eb',
    imageUrl: cardMinjaeUrl,
    featuredImageUrl: cardMinjaeUrl,
  },
  performanceTitle: FALLBACK_PERFORMANCE_TITLE,
  stats: HOME_ACHIEVEMENT_STATS,
  highlight: HOME_ACHIEVEMENT_HIGHLIGHT,
  performanceBottomText: null,
  partnerRows: HOME_PARTNER_LOGO_ROWS,
  donationTitle: FALLBACK_DONATION_TITLE,
  donationCta1: {
    label: '개인후원 시작하기',
    href: INDIVIDUAL_DONATION_PATH,
    external: false,
  },
  donationCta2: {
    label: '기업후원 문의하기',
    href: CORPORATE_DONATION_PATH,
    external: false,
  },
  socialLinks: [
    {
      channelCode: 'INSTAGRAM',
      label: 'JA Korea 인스타그램',
      href: 'https://www.instagram.com/',
      iconUrl: snsInstagramUrl,
    },
    {
      channelCode: 'FACEBOOK',
      label: 'JA Korea 페이스북',
      href: 'https://www.facebook.com/',
      iconUrl: snsFacebookUrl,
    },
    {
      channelCode: 'LINKEDIN',
      label: 'JA Korea 링크드인',
      href: 'https://www.linkedin.com/',
      iconUrl: snsLinkedinUrl,
    },
    {
      channelCode: 'NAVER_BLOG',
      label: 'JA Korea 네이버 블로그',
      href: 'https://blog.naver.com/',
      iconUrl: snsNaverBlogUrl,
    },
    {
      channelCode: 'NEWSLETTER',
      label: 'JA Korea 이메일',
      href: 'mailto:jakorea@jakorea.org',
      iconUrl: snsMailUrl,
    },
    {
      channelCode: 'YOUTUBE',
      label: 'JA Korea 유튜브',
      href: 'https://www.youtube.com/',
      iconUrl: snsYoutubeUrl,
    },
  ],
  popups: [],
}

export function getHomeMainFallback(): HomeMainFallback {
  return HOME_MAIN_FALLBACK
}
