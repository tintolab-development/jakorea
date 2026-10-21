export {
  HOME_ACHIEVEMENT_HIGHLIGHT,
  HOME_ACHIEVEMENT_STATS,
  HOME_HERO_AUTOPLAY_MS,
  HOME_HERO_SLIDES,
  HOME_PARTNER_LOGO_ROWS,
  HOME_YOUTUBE_URL,
  getHomeAchievementHighlight,
  getHomeAchievementStats,
} from './lib/home-fallback-content'
export type {
  HomeAchievementStat,
  HomeHeroSlide,
  HomePartnerLogo,
} from './lib/home-fallback-content'

export { HOME_MAIN_FALLBACK, getHomeMainFallback } from './lib/fallback'
export { FALLBACK_IMPACT_TITLE } from './lib/view'
export type { HomeMainQuery, HomeMainView } from './lib/view'
export { homePublicMainQueryOptions, useHomeMain } from './api/use-home-main'

export { AchievementSection } from './ui/achievement-section'
export { HeroCarousel } from './ui/hero-carousel'
export { HomePopupOverlay } from './ui/popup-overlay'
export type { HeroCarouselProps } from './ui/hero-carousel'
export { PartnerMarqueeSection } from './ui/partner-marquee-section'
export { ProgramCarouselSection } from './ui/program-carousel-section'
export { SocialRail } from './ui/social-rail'
export { StorySection } from './ui/story-section'
