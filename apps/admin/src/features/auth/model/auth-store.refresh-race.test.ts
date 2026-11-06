/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth-store'

const original = useAuthStore.getState()
const logout = vi.fn()
const initialAccess = 'original-admin-access'
const replacementAccess = 'replacement-admin-access'
const initialRefresh = 'original-admin-refresh'
const replacementRefresh = 'replacement-admin-refresh'
let settle!: (ok: boolean) => void
let refreshPromise!: Promise<boolean>

async function complete(ok: boolean) {
  settle(ok)
  await refreshPromise
  await Promise.resolve()
  await Promise.resolve()
}

describe('Homepage Admin: periodic Refresh race', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    const expiry = new Date(Date.now() + 10_000).toISOString()
    localStorage.setItem('hp_admin_auth_token', initialAccess)
    localStorage.setItem('hp_admin_auth_expires_at', expiry)
    localStorage.setItem('hp_admin_auth_refresh_token', initialRefresh)
    refreshPromise = new Promise<boolean>(resolve => { settle = resolve })
    useAuthStore.setState({
      token: initialAccess, isAuthenticated: true, expiresAt: expiry,
      logout, refreshToken: vi.fn(() => refreshPromise),
    })
  })
  afterEach(() => {
    useAuthStore.setState({
      token: null, isAuthenticated: false, logout: original.logout,
      refreshToken: original.refreshToken,
    })
    localStorage.clear()
  })

  it('failure of a previous Refresh cannot logout a newly rotated access/refresh pair', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    localStorage.setItem('hp_admin_auth_token', replacementAccess)
    localStorage.setItem('hp_admin_auth_refresh_token', replacementRefresh)
    useAuthStore.setState({ token: replacementAccess })
    await complete(false)
    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(replacementAccess)
  })

  it('failure cannot logout a session when another tab has rotated only its refresh token', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    localStorage.setItem('hp_admin_auth_refresh_token', replacementRefresh)
    await complete(false)
    expect(logout).not.toHaveBeenCalled()
  })

  it('a failed near-expiry Refresh still logs out if credentials have not changed', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    await complete(false)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('a successful near-expiry Refresh never logs out', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    await complete(true)
    expect(logout).not.toHaveBeenCalled()
  })
})
