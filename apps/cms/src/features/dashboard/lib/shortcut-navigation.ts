/**
 * 메뉴 바로가기 이동 경로·배지 집계 범위 (QA-0083, QA-0141).
 *
 * - 경로: GET /api/admin/dashboard/shortcuts `targetUrl`이 CMS 라우트와 어긋나는 키만 FE 라우트로 고친다.
 *   (`programs-detail` targetUrl=`/programs` → 메뉴·라우트는 `/detailed-program`) — BE 카탈로그 정정 요청 대상.
 * - 배지: BE 계약상 두 종류 — 신규(이 관리자의 마지막 확인 이후 created_at) / 대기(현재 PENDING).
 *   대기 키는 이동 목록에도 같은 상태 필터를 건다. 신규 키는 lastReadAt이 응답에 없어 목록 조건을 맞출 수 없다.
 */

import { isDashboardPendingWaitShortcut } from '@/features/dashboard/api/adapters/dashboard-adapters'

const SHORTCUT_ROUTE_OVERRIDES: Readonly<Record<string, string>> = {
  'programs-detail': '/detailed-program',
}

/** 대기 배지 키 → 이동 목록에 붙일 같은 조건 (목록 URL 필터 계약이 있는 것만) */
const PENDING_SHORTCUT_LIST_FILTERS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  // 문의 목록 「답변 현황: 답변 대기」 (badge: GET /api/admin/inquiries?status=PENDING)
  inquiries: { inq_st: 'PENDING' },
}

/** 신규 배지 중 대상 집합 설명이 메뉴명과 다른 키 */
const NEW_BADGE_SCOPE_SUBJECT: Readonly<Record<string, string>> = {
  'programs-detail': '프로그램(전체 유형)',
}

export function resolveShortcutRoutePath(shortcutId: string, path: string): string {
  return SHORTCUT_ROUTE_OVERRIDES[shortcutId] ?? path
}

/** 배지가 있을 때 이동 경로 — 대기 키는 같은 상태 필터를 쿼리에 싣는다 */
export function resolveShortcutNavigationPath(
  shortcutId: string,
  path: string,
  hasBadge: boolean
): string {
  const filters = hasBadge ? PENDING_SHORTCUT_LIST_FILTERS[shortcutId] : undefined
  if (!filters) return path
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  for (const [key, value] of Object.entries(filters)) {
    params.set(key, value)
  }
  return `${pathname}?${params.toString()}`
}

/** 메뉴명 → 툴팁 대상명: 끝의 '관리'·'확인'을 뗀다 (예: 강사 회원 관리 → 강사 회원) */
function shortcutBadgeSubjectFromMenuLabel(menuLabel: string): string {
  return menuLabel.trim().replace(/\s+(관리|확인)$/, '')
}

/**
 * 배지 툴팁·aria — 집계 범위 안내 (QA-0141, 기획 확정 2026-11-12).
 * 신규: "마지막 확인 이후 신규 {대상} N건" / 대기: "처리 대기 N건 (현재 기준)"
 */
export function shortcutBadgeScopeLabel(
  shortcutId: string,
  count: number,
  menuLabel?: string
): string {
  if (isDashboardPendingWaitShortcut(shortcutId)) {
    return `처리 대기 ${count}건 (현재 기준)`
  }
  const subject =
    NEW_BADGE_SCOPE_SUBJECT[shortcutId] ??
    (menuLabel ? shortcutBadgeSubjectFromMenuLabel(menuLabel) : '')
  return subject
    ? `마지막 확인 이후 신규 ${subject} ${count}건`
    : `마지막 확인 이후 신규 ${count}건`
}
