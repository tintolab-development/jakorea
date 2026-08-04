import { createMenuIcon } from './create-menu-icon'
import { MENU_ICON_PATHS } from './paths'

export type { MenuIconProps } from './create-menu-icon'

/** 메인 화면 관리 */
export const MainScreenMenuIcon = createMenuIcon(MENU_ICON_PATHS.mainScreen, 'MainScreenMenuIcon')

/** JA Korea 관리 */
export const JaKoreaMenuIcon = createMenuIcon(MENU_ICON_PATHS.jaKorea, 'JaKoreaMenuIcon')

/** 임팩트 스토리 관리 */
export const ImpactStoryMenuIcon = createMenuIcon(
  MENU_ICON_PATHS.impactStory,
  'ImpactStoryMenuIcon'
)

/** 교육 소개 관리 */
export const EducationMenuIcon = createMenuIcon(MENU_ICON_PATHS.education, 'EducationMenuIcon')

/** 후원하기 관리 */
export const SponsorMenuIcon = createMenuIcon(MENU_ICON_PATHS.sponsor, 'SponsorMenuIcon')

/** 참여하기 관리 */
export const ParticipateMenuIcon = createMenuIcon(
  MENU_ICON_PATHS.participate,
  'ParticipateMenuIcon'
)

/** 사이트 관리 */
export const SiteMenuIcon = createMenuIcon(MENU_ICON_PATHS.site, 'SiteMenuIcon')

/** 통계 관리 */
export const StatsMenuIcon = createMenuIcon(MENU_ICON_PATHS.stats, 'StatsMenuIcon')

/** 로그 관리 */
export const LogsMenuIcon = createMenuIcon(MENU_ICON_PATHS.logs, 'LogsMenuIcon')
