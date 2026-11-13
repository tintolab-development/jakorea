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

describe('CMS: periodic Refresh race', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    const expiry = new Date(Date.now() + 10_000).toISOString()
    localStorage.setItem('auth_token', initialAccess)
    localStorage.setItem('auth_expires_at', expiry)
    localStorage.setItem('auth_refresh_token', initialRefresh)
    refreshPromise = new Promise<boolean>(resolve => { settle = resolve })
    useAuthStore.setState({
      token: initialAccess, isAuthenticated: true, expiresAt: expiry,
      logout, refreshToken: vi.fn(() => refreshPromise),
      refreshSession: vi.fn(() => refreshPromise.then(ok => (ok ? 'ok' as const : 'invalid' as const))),
    })
  })
  afterEach(() => {
    useAuthStore.setState({
      token: null, isAuthenticated: false, logout: original.logout,
      refreshToken: original.refreshToken,
      refreshSession: original.refreshSession,
    })
    localStorage.clear()
  })

  it('failure of a previous Refresh cannot logout a newly rotated access/refresh pair', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    localStorage.setItem('auth_token', replacementAccess)
    localStorage.setItem('auth_refresh_token', replacementRefresh)
    useAuthStore.setState({ token: replacementAccess })
    await complete(false)
    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(replacementAccess)
  })

  it('failure cannot logout a session when another tab has rotated only its refresh token', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    localStorage.setItem('auth_refresh_token', replacementRefresh)
    await complete(false)
    expect(logout).not.toHaveBeenCalled()
  })

  it('a failed near-expiry Refresh still logs out if credentials have not changed', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    await complete(false)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('a near-expiry Refresh that fails with 5xx/network (transient) does not logout', async () => {
    useAuthStore.setState({ refreshSession: vi.fn(async () => 'transient' as const) })
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    await Promise.resolve()
    await Promise.resolve()
    expect(logout).not.toHaveBeenCalled()
  })

  it('a successful near-expiry Refresh never logs out', async () => {
    expect(useAuthStore.getState().checkSessionExpiry()).toBe(false)
    await complete(true)
    expect(logout).not.toHaveBeenCalled()
  })
  it('a delayed boot checkAuth failure cannot revoke a newer login', async () => {
    const expiresAt = new Date(Date.now() - 10_000).toISOString()
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem('auth_user', JSON.stringify({ id: 'old-user', isActive: true }))
    useAuthStore.setState({
      expiresAt,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })

    const pending = useAuthStore.getState().checkAuth()
    localStorage.setItem('auth_token', replacementAccess)
    localStorage.setItem('auth_user', JSON.stringify({ id: 'new-user', isActive: true }))
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 3600_000).toISOString())
    useAuthStore.setState({ token: replacementAccess, isAuthenticated: true })
    await complete(false)
    await pending

    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(replacementAccess)
  })

  it('a failed checkAuth Refresh logs out locally without a server logout (stored credential may be another tab login)', async () => {
    const expiresAt = new Date(Date.now() - 10_000).toISOString()
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem('auth_user', JSON.stringify({ id: 'same-user', isActive: true }))
    useAuthStore.setState({
      expiresAt,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })

    const pending = useAuthStore.getState().checkAuth()
    await complete(false)
    await pending

    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith({ skipRemote: true })
  })

  it('a delayed successful boot checkAuth may not replace a different login identity', async () => {
    const expiresAt = new Date(Date.now() - 10_000).toISOString()
    localStorage.setItem('auth_expires_at', expiresAt)
    localStorage.setItem('auth_user', JSON.stringify({ id: 'old-user', isActive: true }))
    useAuthStore.setState({
      expiresAt,
      _isCheckingAuth: false,
      _checkAuthPromise: null,
    })

    const pending = useAuthStore.getState().checkAuth()
    const newUser = JSON.stringify({ id: 'new-user', isActive: true })
    localStorage.setItem('auth_token', replacementAccess)
    localStorage.setItem('auth_user', newUser)
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 3600_000).toISOString())
    useAuthStore.setState({ token: replacementAccess, isAuthenticated: true })
    await complete(true)
    await pending

    expect(logout).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe(replacementAccess)
    expect(localStorage.getItem('auth_user')).toBe(newUser)
  })

})
