/** GNB 카테고리 중 본 페이지 미구현 구간의 임시 경로 */

export const ABOUT_HISTORY_PATH = '/about/history'

export const TEMPORARY_PAGE_TITLES: Record<string, string> = {}

export const TEMPORARY_PAGE_PATHS = Object.keys(TEMPORARY_PAGE_TITLES)

export function isTemporaryPagePath(pathname: string): boolean {
  return TEMPORARY_PAGE_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function getTemporaryPageTitle(pathname: string): string {
  return TEMPORARY_PAGE_TITLES[pathname] ?? '준비 중'
}
