import { useCallback, useEffect, useRef, useState } from 'react'
import {
  correctedNowMs,
  createSessionWarningDismissState,
  resolveSessionWarningView,
  type AdminAuthSessionResponse,
  type SessionWarningKind,
} from '@jakorea/domain/session'
import { clearAuthTokens, getAccessToken } from '@/shared/lib/auth-token'
import { isPortalSessionApiAvailable } from './portal-session-contract'

export function usePortalSessionTimeout() {
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()))
  const [session] = useState<AdminAuthSessionResponse | null>(null)
  const [visibleKind, setVisibleKind] = useState<SessionWarningKind | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const dismissRef = useRef(createSessionWarningDismissState())

  const refreshAuthPresence = useCallback(() => {
    setHasToken(Boolean(getAccessToken()))
  }, [])

  useEffect(() => {
    refreshAuthPresence()
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'platform_auth_token' || event.key === 'platform_auth_refresh_token') {
        refreshAuthPresence()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refreshAuthPresence])

  useEffect(() => {
    if (!hasToken || !isPortalSessionApiAvailable()) {
      setVisibleKind(null)
      setRemainingMs(0)
      dismissRef.current.clear()
      return
    }
    const tick = () => {
      const view = resolveSessionWarningView({
        session,
        nowMs: correctedNowMs(Date.now(), 0),
      })
      const show =
        view != null && dismissRef.current.shouldShow(view.kind, view.expiresAtMs, Date.now())
      setVisibleKind(show ? view.kind : null)
      setRemainingMs(view?.remainingMs ?? 0)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [hasToken, session])

  const dismissWarning = useCallback(() => {
    const view = resolveSessionWarningView({
      session,
      nowMs: correctedNowMs(Date.now(), 0),
    })
    if (view) dismissRef.current.dismiss(view.kind, view.expiresAtMs, Date.now())
    setVisibleKind(null)
  }, [session])

  const logout = useCallback(() => {
    clearAuthTokens()
    setHasToken(false)
    if (typeof window !== 'undefined') {
      window.location.assign('/auth/sign-in')
    }
  }, [])

  const extendIdleSession = useCallback(async () => {
    return false
  }, [])

  return {
    showWarning: visibleKind != null,
    warningKind: visibleKind,
    countdown: Math.max(0, Math.ceil(remainingMs / 1000)),
    extending: false,
    contract: 'BLOCKED_BY_PORTAL_BE_CONTRACT' as const,
    dismissWarning,
    extendIdleSession,
    logout,
  }
}
