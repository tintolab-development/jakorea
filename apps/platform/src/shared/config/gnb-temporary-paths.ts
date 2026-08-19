/** GNB 카테고리 중 본 페이지 미구현 구간의 임시 경로 */

export const ABOUT_INTRODUCTION_PATH = '/about/introduction'
export const ABOUT_HISTORY_PATH = '/about/history'
export const ABOUT_CAREERS_PATH = '/about/careers'

export const EDUCATION_CAREER_PATH = '/education/career'
export const EDUCATION_FINANCE_PATH = '/education/finance'
export const EDUCATION_ENTREPRENEURSHIP_PATH = '/education/entrepreneurship'
export const EDUCATION_DIGITAL_LITERACY_PATH = '/education/digital-literacy'

export const SUPPORT_TALENT_PATH = '/support/talent'

export const TEMPORARY_PAGE_TITLES: Record<string, string> = {
  [ABOUT_INTRODUCTION_PATH]: '기관소개',
  [ABOUT_HISTORY_PATH]: 'JA History',
  [ABOUT_CAREERS_PATH]: '채용',
  [EDUCATION_CAREER_PATH]: '진로취업',
  [EDUCATION_FINANCE_PATH]: '경제금융',
  [EDUCATION_ENTREPRENEURSHIP_PATH]: '기업가 정신',
  [EDUCATION_DIGITAL_LITERACY_PATH]: '디지털 리터러시',
  [SUPPORT_TALENT_PATH]: '재능기부',
}

export const TEMPORARY_PAGE_PATHS = Object.keys(TEMPORARY_PAGE_TITLES)

export function isTemporaryPagePath(pathname: string): boolean {
  return TEMPORARY_PAGE_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function getTemporaryPageTitle(pathname: string): string {
  return TEMPORARY_PAGE_TITLES[pathname] ?? '준비 중'
}
