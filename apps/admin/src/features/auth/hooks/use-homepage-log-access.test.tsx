/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

let meQuery: { isSuccess: boolean; isError: boolean; data?: { roleCode?: string; permissions?: string[] } }

vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean; user: { id: string } }) => unknown) =>
    selector({ isAuthenticated: true, user: { id: '1' } }),
}))
vi.mock('@/features/auth/api/use-admin-me-profile', () => ({
  useAdminMeProfile: () => meQuery,
}))

import { useHomepageLogAccess } from './use-homepage-log-access'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Probe() {
  return <span>{useHomepageLogAccess().status}</span>
}

function readStatus(): string {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(<Probe />))
  const status = container.textContent ?? ''
  act(() => root.unmount())
  return status
}

describe('useHomepageLogAccess', () => {
  it('본인 정보 조회 중이면 pending', () => {
    meQuery = { isSuccess: false, isError: false }
    expect(readStatus()).toBe('pending')
  })

  it('조회 실패는 denied — 로그 화면을 열지 않는다', () => {
    meQuery = { isSuccess: false, isError: true }
    expect(readStatus()).toBe('denied')
  })

  it('Master는 allowed, 그 외는 denied', () => {
    meQuery = { isSuccess: true, isError: false, data: { roleCode: 'MASTER', permissions: ['HOMEPAGE_VIEW'] } }
    expect(readStatus()).toBe('allowed')
    meQuery = {
      isSuccess: true,
      isError: false,
      data: { roleCode: 'PROGRAM_MANAGER', permissions: ['HOMEPAGE_VIEW', 'HOMEPAGE_EDIT'] },
    }
    expect(readStatus()).toBe('denied')
  })
})
