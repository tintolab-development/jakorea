import type { NavigateFunction } from 'react-router-dom'

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

/** 프로그램 상세 닫기 — 저장된 회원 상세 URL이 있으면 이동하고 true */
export function tryNavigateMemberDetailReturn(navigate: NavigateFunction): boolean {
  const target = consumeMemberDetailReturnAfterProgram()
  if (!target?.trim()) return false
  navigate(target)
  return true
}
