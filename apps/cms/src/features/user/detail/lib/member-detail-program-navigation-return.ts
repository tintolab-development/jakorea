import type { NavigateFunction } from 'react-router-dom'
import { navigateToAncestorOrReplace } from '@/shared/lib/history-ancestor-navigation'

const STORAGE_KEY = 'cms:member-detail-return-after-program'

/** 회원 상세 → 프로그램 상세 이동 직전 현재 URL 저장 (`/users/list` + `id` 필수) */
export function stashMemberDetailReturnForProgramNavigation(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.pathname.includes('/users/list')) return
  if (!url.searchParams.get('id')?.trim()) return
  sessionStorage.setItem(STORAGE_KEY, `${url.pathname}${url.search}`)
}

export function peekMemberDetailReturnAfterProgram(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEY)
}

function consumeMemberDetailReturnAfterProgram(): string | null {
  const value = peekMemberDetailReturnAfterProgram()
  if (value) sessionStorage.removeItem(STORAGE_KEY)
  return value
}

/**
 * 프로그램 상세 닫기 — 저장된 회원 상세 URL이 있으면 이동하고 true.
 * 회원 상세 엔트리가 바로 앞 history에 있으면 뒤로(앞쪽에 프로그램 엔트리를 남기지 않음), 없으면 replace.
 */
export function tryNavigateMemberDetailReturn(navigate: NavigateFunction): boolean {
  const target = consumeMemberDetailReturnAfterProgram()
  if (!target?.trim()) return false
  const url = new URL(target, window.location.origin)
  navigateToAncestorOrReplace(navigate, { pathname: url.pathname, search: url.search })
  return true
}

/**
 * 프로그램 화면을 벗어나면(브라우저 뒤로가기로 회원 상세 복귀, 다른 메뉴 이동) 저장된 복귀 URL을 버린다.
 * 남겨 두면 이후 무관한 프로그램 상세를 닫을 때 예전 회원 상세로 이동한다.
 */
export function discardMemberDetailReturnOutsidePrograms(pathname: string): void {
  if (typeof window === 'undefined') return
  if (pathname.startsWith('/programs')) return
  if (!peekMemberDetailReturnAfterProgram()) return
  sessionStorage.removeItem(STORAGE_KEY)
}
