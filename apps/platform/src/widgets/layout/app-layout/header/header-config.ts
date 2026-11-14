import { isCareersPath } from '@/features/careers'
import { isHistoryPath } from '@/features/history'
import { isNoticesPath } from '@/features/notice'
import { isDirectionsPath } from '@/features/directions'
import { isImpactStoriesPath } from '@/features/impact-story'
import { isIntroductionPath } from '@/features/introduction'
import { isPeoplePath } from '@/features/people'
import { isProgramsPath } from '@/features/program'
import { isResultsPath } from '@/features/result'
import { isTextbooksPath } from '@/features/textbook'
import { isTransparencyPath } from '@/features/transparency'
import { MYPAGE_PATH } from '@/features/mypage'
import {
  gnbFallbackGroups,
  type GnbNavGroup,
  type GnbNavItem,
} from '@/features/site-shell/lib/menu-routes'
import { isTemporaryPagePath } from '@/shared/config/gnb-temporary-paths'
import { getDevAuthLoggedIn, resolveLoginRequiredPath } from '@/shared/lib'
import logOutIconUrl from '../image/icon/log-out.svg'
import notificationsIconUrl from '../image/icon/notifications.svg'
import personIconUrl from '../image/icon/person.svg'

export type NavigationSubItem = GnbNavItem

export type NavigationGroup = GnbNavGroup

/** Notion GNB 기획 기준 fallback. href는 `menu-routes`가 SSOT. */
export const navigationGroups = gnbFallbackGroups

export type NavigationItemLabel = (typeof navigationGroups)[number]['label']

export const navigationItems = navigationGroups.map(group => group.label)

export const guestUserActionRoutes: Record<string, string> = {
  회원가입: '/auth/sign-up',
  로그인: '/auth/sign-in',
}

export const loggedInActions = [
  { label: '알림', iconUrl: notificationsIconUrl },
  { label: '마이페이지', iconUrl: personIconUrl },
  { label: '로그아웃', iconUrl: logOutIconUrl },
] as const

export const loggedInActionRoutes: Partial<Record<string, string>> = {
  마이페이지: MYPAGE_PATH,
}

export function getLoggedInActionRoute(label: string) {
  if (label === '마이페이지' && !getDevAuthLoggedIn()) {
    return resolveLoginRequiredPath(MYPAGE_PATH)
  }

  return loggedInActionRoutes[label]
}

/** 상위 카테고리 클릭 시 이동 대상. 표시 순서의 첫 하위 메뉴를 쓴다. */
export function getTopCategoryNavigationTarget(
  group: NavigationGroup,
): { href: string; external: boolean } | null {
  const firstChild = group.children[0]
  if (firstChild?.href) {
    return { href: firstChild.href, external: Boolean(firstChild.external) }
  }

  if (group.href) {
    return { href: group.href, external: false }
  }

  return null
}

export function getActiveNavigationGroupCode(pathname: string): string | null {
  const label = getActiveNavigationItem(pathname)
  if (!label) return null
  return navigationGroups.find(group => group.label === label)?.groupCode ?? null
}

export function getActiveNavigationItem(pathname: string): NavigationItemLabel | null {
  if (isProgramsPath(pathname) || isResultsPath(pathname)) {
    return '참여하기'
  }

  if (
    isTextbooksPath(pathname) ||
    pathname.startsWith('/education/')
  ) {
    return '교육 소개'
  }

  if (isImpactStoriesPath(pathname)) {
    return '임팩트'
  }

  if (pathname.startsWith('/support/')) {
    return '후원하기'
  }

  if (
    isNoticesPath(pathname) ||
    isPeoplePath(pathname) ||
    isDirectionsPath(pathname) ||
    isTransparencyPath(pathname) ||
    isIntroductionPath(pathname) ||
    isCareersPath(pathname) ||
    isHistoryPath(pathname) ||
    isTemporaryPagePath(pathname)
  ) {
    return 'JA Korea'
  }

  // 메인(/) 등 GNB 하위 경로가 아니면 활성 탭 없음
  return null
}
