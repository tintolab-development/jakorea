import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { ImpactStoryListItem } from '@/features/impact-story'
import type {
  HomeAchievementStat,
  HomeHeroSlide,
  HomePartnerLogo,
} from './home-fallback-content'

export type HomeStripBanner = {
  id: string
  label: string
  href: string
  backgroundColor: string
  external: boolean
}

export type HomeSocialLink = {
  channelCode: string
  label: string
  href: string
  iconUrl: string
}

export type HomeDonationCta = {
  label: string
  href: string
  external: boolean
}

/** Admin 메인 팝업 관리 → GET /api/public/main popups. 동시 노출 상한은 Admin MAX_ACTIVE_POPUPS 와 같다. */
export const MAX_HOME_POPUPS = 4

export type HomePopup = {
  id: string
  imageUrl: string
  altText: string
  href?: string
  external?: boolean
}

/** 홈 프로그램 카드. 신청 카탈로그(`/programs`) 상세 스키마와 분리한다. */
export type HomeProgramCard = {
  id: string
  /** 목록 행 식별 키(모집 행 단위) */
  entryKey: string
  /** 그 카드 모집 행으로 여는 상세 경로 */
  detailPath: string
  title: string
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  thumbnailUrl?: string
}

export type HomeMainView = {
  source: 'pending' | 'fallback' | 'remote'
  strips: readonly HomeStripBanner[]
  heroes: readonly HomeHeroSlide[]
  educationTitle: string
  programs: readonly HomeProgramCard[]
  youtubeUrl: string
  impactTitle: string
  featuredStory: ImpactStoryListItem | null
  performanceTitle: string
  stats: readonly HomeAchievementStat[]
  highlight: HomeAchievementStat | null
  /** null이면 Achievement 시안 JSX(강조) 유지 */
  performanceBottomText: string | null
  partnerRows: readonly (readonly HomePartnerLogo[])[]
  donationTitle: string
  donationCta1: HomeDonationCta
  donationCta2: HomeDonationCta
  socialLinks: readonly HomeSocialLink[]
  popups: readonly HomePopup[]
}

export type HomeMainFallback = Omit<HomeMainView, 'source' | 'featuredStory'> & {
  featuredStory: ImpactStoryListItem | null
}

export type HomeMainQuery = HomeMainView & {
  isRemoteEnabled: boolean
  isPending: boolean
  isFetching: boolean
  isError: boolean
}

export const HOME_PROGRAM_CARD_LIMIT = 8

export const FALLBACK_EDUCATION_TITLE = '새로운 배움이 기다리고 있어요'
export const FALLBACK_PERFORMANCE_TITLE = '함께 만들어온 배움의 여정'
export const FALLBACK_IMPACT_TITLE = 'JA Korea와 함께\n청소년의 가능성을 넓혀주세요'
export const FALLBACK_DONATION_TITLE =
  '더 많은 학생들이 배움의 기회를\n만날 수 있게 함께해 주세요'
export const FALLBACK_INDIVIDUAL_DONATION_PATH = '/support/individual'
export const FALLBACK_CORPORATE_DONATION_PATH = '/support/corporate'
export { FALLBACK_STRIP_COLORS } from './strip-colors.ts'
