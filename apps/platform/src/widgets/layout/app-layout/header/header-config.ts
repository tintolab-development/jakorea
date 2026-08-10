import { isNoticesPath, NOTICES_PATH } from '@/features/notice'
import { isPeoplePath, PEOPLE_PATH } from '@/features/people'
import { isProgramsPath, PROGRAMS_PATH } from '@/features/program'
import { isResultsPath, RESULTS_PATH } from '@/features/result'
import { isTextbooksPath, TEXTBOOKS_PATH } from '@/features/textbook'
import { MYPAGE_PATH } from '@/features/mypage'
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

export const navigationGroups = [
  {
    label: 'JA Korea',
    children: [
      { label: '기관 소개' },
      { label: 'JA History' },
      { label: '투명경영' },
      { label: '함께하는 사람들', href: PEOPLE_PATH },
      { label: '오시는 길' },
      { label: '공지사항', href: NOTICES_PATH },
      { label: '채용' },
    ],
  },
  {
    label: '임팩트',
    children: [{ label: '임팩트' }],
  },
  {
    label: '교육 소개',
    children: [
      { label: '진로취업' },
      { label: '경제금융' },
      { label: '기업가정신' },
      { label: '디지털리터러시' },
      { label: '교재', href: TEXTBOOKS_PATH },
    ],
  },
  {
    label: '참여하기',
    children: [
      { label: '프로그램 신청', href: PROGRAMS_PATH },
      { label: '결과 확인', href: RESULTS_PATH },
      { label: '온라인 학습', external: true },
      { label: 'Alumni', external: true },
    ],
  },
  {
    label: '후원하기',
    href: '/auth/required?redirect=/support',
    children: [
      { label: '개인후원' },
      { label: '기업후원' },
      { label: '재능기부' },
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
  { label: '알림확인', iconUrl: notificationsIconUrl },
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

  if (isTextbooksPath(pathname)) {
    return '교육 소개'
  }

  if (isNoticesPath(pathname) || isPeoplePath(pathname)) {
    return 'JA Korea'
  }

  return 'JA Korea'
}
