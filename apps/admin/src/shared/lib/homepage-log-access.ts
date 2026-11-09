import { ADMIN_ACCESS_DENIED_ALERT } from '@/shared/lib/admin-access-denied'
/**
 * 권한 설정 V1.2 홈페이지 어드민 '로그 관리' 화면·다운로드: Master 전용.
 * BE `HomepageLogQueryService`와 같은 기준(MASTER 역할 + HOMEPAGE_VIEW)으로 화면 진입 전에 막는다.
 */
export const HOMEPAGE_LOG_ACCESS_DENIED_ALERT = ADMIN_ACCESS_DENIED_ALERT

export function isHomepageLogPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return normalized === '/logs' || normalized.startsWith('/logs/')
}

export function canAccessHomepageLogs(
  roleCode: string | undefined,
  permissions: readonly string[] | undefined
): boolean {
  return (
    (roleCode ?? '').trim().toUpperCase() === 'MASTER' &&
    (permissions ?? []).includes('HOMEPAGE_VIEW')
  )
}
