/** @vitest-environment jsdom */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mounted: { root: Root; container: HTMLDivElement }[] = []
function render(node: ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  act(() => { root.render(node) })
}
function cleanup() {
  for (const { root, container } of mounted.splice(0)) {
    act(() => { root.unmount() })
    container.remove()
  }
}

const tracker = vi.hoisted(() => ({
  fire: null as null | (() => void),
  post: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
}))
vi.mock('@/features/auth/lib/session-keepalive', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/auth/lib/session-keepalive')>()
  return {
    ...actual,
    startUserActivityTracking: (_window: Window, callback: () => void) => {
      tracker.fire = callback
      return () => { tracker.fire = null }
    },
  }
})
vi.mock('@/features/auth/api/admin-session-fetcher', () => ({
  postAdminAuthActivity: () => tracker.post(),
  isAdminAuthUnauthorizedError: (e: { response?: { status?: number } }) => e?.response?.status === 401,
  isAdminAuthForbiddenError: (e: { response?: { status?: number } }) => e?.response?.status === 403,
}))
vi.mock('@/features/auth/ui/session-warning-modal', () => ({ SessionWarningModal: () => null }))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { AuthProvider } from './auth-provider'

const OLD = 'old-admin-access'
const NEW = 'new-admin-access'

describe('Homepage Admin: AuthProvider stale Activity errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tracker.fire = null
    localStorage.clear()
    localStorage.setItem('hp_admin_auth_token', OLD)
    localStorage.setItem('hp_admin_auth_refresh_token', 'refresh-fixture')
    const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString()
    localStorage.setItem('hp_admin_auth_expires_at', expiresAt)
    tracker.checkAuth.mockResolvedValue(undefined)
    useAuthStore.setState({
      token: OLD, isAuthenticated: true, expiresAt,
      logout: tracker.logout, checkAuth: tracker.checkAuth,
    })
  })
  afterEach(() => {
    cleanup()
    tracker.fire = null
    useAuthStore.setState({ isAuthenticated: false, token: null })
    localStorage.clear()
  })

  it('Activity 401 from the previous token cannot logout a refreshed session', async () => {
    let rejectOld!: (e: unknown) => void
    tracker.post.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject }))
    render(<AuthProvider><div>app</div></AuthProvider>)
    expect(tracker.fire).not.toBeNull()
    await act(async () => { tracker.fire?.() })
    await act(async () => { useAuthStore.setState({ token: NEW }) })
    await act(async () => { rejectOld({ response: { status: 401 } }) })
    expect(tracker.logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(NEW)
  })

  it('Activity 401 from the still-current token does logout', async () => {
    tracker.post.mockRejectedValue({ response: { status: 401 } })
    render(<AuthProvider><div>app</div></AuthProvider>)
    await act(async () => { tracker.fire?.(); await Promise.resolve() })
    expect(tracker.logout).toHaveBeenCalledTimes(1)
  })

  it('Activity 403 is permission denial, not token expiration', async () => {
    tracker.post.mockRejectedValue({ response: { status: 403 } })
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      render(<AuthProvider><div>app</div></AuthProvider>)
      await act(async () => { tracker.fire?.(); await Promise.resolve() })
      expect(tracker.logout).not.toHaveBeenCalled()
      expect(useAuthStore.getState().token).toBe(OLD)
    } finally {
      log.mockRestore()
    }
  })
})
