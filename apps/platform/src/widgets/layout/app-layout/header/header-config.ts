import { isNoticesPath, NOTICES_PATH } from '@/features/notice'
import { isDirectionsPath, DIRECTIONS_PATH } from '@/features/directions'
import { IMPACT_STORIES_PATH, isImpactStoriesPath } from '@/features/impact-story'
import { isPeoplePath, PEOPLE_PATH } from '@/features/people'
import { isProgramsPath, PROGRAMS_PATH } from '@/features/program'
import { isResultsPath, RESULTS_PATH } from '@/features/result'
import { isTextbooksPath, TEXTBOOKS_PATH } from '@/features/textbook'
import { isTransparencyPath, TRANSPARENCY_PATH } from '@/features/transparency'
import { MYPAGE_PATH } from '@/features/mypage'
import {
  ABOUT_CAREERS_PATH,
  ABOUT_HISTORY_PATH,
  ABOUT_INTRODUCTION_PATH,
  EDUCATION_CAREER_PATH,
  EDUCATION_DIGITAL_LITERACY_PATH,
  EDUCATION_ENTREPRENEURSHIP_PATH,
  EDUCATION_FINANCE_PATH,
  isTemporaryPagePath,
  SUPPORT_CORPORATE_PATH,
  SUPPORT_INDIVIDUAL_PATH,
  SUPPORT_TALENT_PATH,
} from '@/shared/config/gnb-temporary-paths'
import { getDevAuthLoggedIn } from '@/shared/lib'
import logOutIconUrl from '../image/icon/log-out.svg'
import notificationsIconUrl from '../image/icon/notifications.svg'
import personIconUrl from '../image/icon/person.svg'

export type NavigationSubItem = {
  label: string
  href?: string
  external?: boolean
}

export type NavigationGroup = {
  label: string
  href?: string
  children: NavigationSubItem[]
}

/** Notion GNB 기획(https://app.notion.com/p/380f3e2a77d0816ab479e7a3564fc0fc) 기준 */
export const navigationGroups = [
  {
    label: 'JA Korea',
    children: [
      { label: '기관소개', href: ABOUT_INTRODUCTION_PATH },
      { label: '투명경영', href: TRANSPARENCY_PATH },
      { label: '함께하는 사람들', href: PEOPLE_PATH },
      { label: '오시는 길', href: DIRECTIONS_PATH },
      { label: '공지사항', href: NOTICES_PATH },
      { label: 'JA History', href: ABOUT_HISTORY_PATH },
      { label: '채용', href: ABOUT_CAREERS_PATH },
    ],
  },
  {
    label: '임팩트 스토리',
    href: IMPACT_STORIES_PATH,
    children: [{ label: '임팩트 스토리', href: IMPACT_STORIES_PATH }],
  },
  {
    label: '교육 소개',
    children: [
      { label: '진로취업', href: EDUCATION_CAREER_PATH },
      { label: '경제금융', href: EDUCATION_FINANCE_PATH },
      { label: '기업가 정신', href: EDUCATION_ENTREPRENEURSHIP_PATH },
      { label: '디지털 리터러시', href: EDUCATION_DIGITAL_LITERACY_PATH },
      { label: '교재 소개', href: TEXTBOOKS_PATH },
    ],
  },
  {
    label: '참여하기',
    children: [
      { label: '프로그램 신청', href: PROGRAMS_PATH },
      { label: '결과 확인', href: RESULTS_PATH },
      // 외부 링크 URL은 추후 연결 예정
      { label: '온라인 학습', external: true },
      { label: 'Alumni', external: true },
    ],
  },
  {
    label: '후원하기',
    children: [
      { label: '개인후원', href: SUPPORT_INDIVIDUAL_PATH },
      { label: '기업후원', href: SUPPORT_CORPORATE_PATH },
      { label: '재능기부', href: SUPPORT_TALENT_PATH },
    ],
  },
] as const satisfies readonly NavigationGroup[]

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
    return `/auth/required?redirect=${encodeURIComponent(MYPAGE_PATH)}`
  }

  return loggedInActionRoutes[label]
}

export function getActiveNavigationItem(pathname: string): NavigationItemLabel {
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
    return '임팩트 스토리'
  }

  if (pathname.startsWith('/support/')) {
    return '후원하기'
  }

  if (
    isNoticesPath(pathname) ||
    isPeoplePath(pathname) ||
    isDirectionsPath(pathname) ||
    isTransparencyPath(pathname) ||
    isTemporaryPagePath(pathname)
  ) {
    return 'JA Korea'
  }

  return 'JA Korea'
}
