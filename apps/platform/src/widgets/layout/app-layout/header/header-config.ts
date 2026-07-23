import { isProgramsPath, PROGRAMS_PATH } from '@/features/program'
import { MYPAGE_PATH } from '@/features/mypage'
import { getDevAuthLoggedIn } from '@/shared/lib'
import logOutIconUrl from '../image/icon/log-out.svg'
import notificationsIconUrl from '../image/icon/notifications.svg'
import personIconUrl from '../image/icon/person.svg'
export const navigationItems = ['JA Korea', '임팩트', '교육 소개', '참여하기', '후원하기'] as const

export const navigationItemRoutes: Partial<Record<(typeof navigationItems)[number], string>> = {
  참여하기: PROGRAMS_PATH,
  후원하기: '/auth/required?redirect=/support',
}

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

export function getActiveNavigationItem(pathname: string) {
  if (isProgramsPath(pathname)) {
    return '참여하기'
  }

  return 'JA Korea'
}
