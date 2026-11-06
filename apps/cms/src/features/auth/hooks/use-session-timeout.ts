import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyServerClockOffset,
  correctedNowMs,
  createSessionWarningDismissState,
  isSessionIdleStillValid,
  readJwtSidClaim,
  parseInstantMs,
  resolveSessionWarningView,
  type AdminAuthSessionResponse,
  type SessionWarningKind,
} from '@jakorea/domain/session'
import {
  getAdminAuthSession,
  isAdminAuthForbiddenError,
  isAdminAuthRetryableTransportError,
  isAdminAuthUnauthorizedError,
  postAdminAuthActivity,
} from '@/features/auth/api/admin-session-fetcher'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { setSessionWarningActivitySuppressed } from '@/features/auth/lib/session-keepalive'

export function useSessionTimeout() {
  const { isAuthenticated, logout, token } = useAuthStore()
  const [session, setSession] = useState<AdminAuthSessionResponse | null>(null)
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0)
  const [visibleKind, setVisibleKind] = useState<SessionWarningKind | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const [extendError, setExtendError] = useState<string | null>(null)
  const [extending, setExtending] = useState(false)
  const dismissRef = useRef(createSessionWarningDismissState())
  const sessionRef = useRef<AdminAuthSessionResponse | null>(null)
  const syncSequenceRef = useRef(0)
  const expiryRecheckPendingRef = useRef(false)
  const lastExpiryRecheckAtRef = useRef(0)

  const syncSession = useCallback(async () => {
    const initial = useAuthStore.getState()
    if (!initial.isAuthenticated || !initial.token) return
    const requestedToken = initial.token
    const sequence = ++syncSequenceRef.current
    // A response from an earlier token/request must never terminate or overwrite a newer session.
    const isCurrent = () =>
      syncSequenceRef.current === sequence &&
      useAuthStore.getState().isAuthenticated &&
      useAuthStore.getState().token === requestedToken
    try {
      const next = await getAdminAuthSession()
      if (!isCurrent()) return
      sessionRef.current = next
      setSession(next)
      setServerClockOffsetMs(previous =>
        applyServerClockOffset(previous, next.serverNow, Date.now())
      )
    } catch (error) {
      if (!isCurrent()) return
      if (isAdminAuthUnauthorizedError(error)) {
        // Axios has already performed the single permitted Refresh/retry for GET Session.
        logout()
        return
      }
      // 403 is permission denial, 404 can mean the BE route is not deployed, and
      // transport/invalid-response failures are not proof that the JWT expired.
      sessionRef.current = null
      setSession(null)
    }
  }, [logout])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    if (!isAuthenticated) {
      syncSequenceRef.current += 1
      expiryRecheckPendingRef.current = false
      lastExpiryRecheckAtRef.current = 0
      sessionRef.current
      setSession(null)
      setVisibleKind(null)
      setRemainingMs(0)
      setExtendError(null)
      dismissRef.current.clear()
      return
    }
    void syncSession()
  }, [isAuthenticated, token, syncSession])

  useEffect(() => {
    if (!isAuthenticated) return
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void syncSession()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'auth_token' && event.key !== 'auth_refresh_token') return
      const storedToken = window.localStorage.getItem('auth_token')
      const activeToken = useAuthStore.getState().token
      if (!storedToken) {
        // Another tab logged out. Do not attempt a Session GET with a stale in-memory JWT.
        if (event.key === 'auth_token') useAuthStore.getState().logout()
        return
      }
      if (storedToken !== activeToken) {
        const oldSid = readJwtSidClaim(activeToken)
        const newSid = readJwtSidClaim(storedToken)
        if (oldSid && oldSid === newSid) {
          // A sibling tab rotated the access token of the same login session.
          useAuthStore.setState({
            token: storedToken,
            expiresAt: window.localStorage.getItem('auth_expires_at'),
          })
        } else {
          // Different login identity: restore account data via the app auth store,
          // never blindly attach the new token to the previous account's UI state.
          void useAuthStore.getState().checkAuth()
        }
        return
      }
      void syncSession()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('storage', onStorage)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
    }
  }, [isAuthenticated, syncSession])

  useEffect(() => {
    if (!isAuthenticated) return
    const tick = () => {
      const nowMs = correctedNowMs(Date.now(), serverClockOffsetMs)
      const view = resolveSessionWarningView({ session, nowMs })
      if (view && view.remainingMs <= 0) {
        // A client timer (clock skew, suspended tab, stale status) is not a server
        // revocation verdict. Recheck GET Session; only a current 401 may logout.
        const clientNow = Date.now()
        if (!expiryRecheckPendingRef.current &&
            clientNow - lastExpiryRecheckAtRef.current >= 15_000) {
          lastExpiryRecheckAtRef.current = clientNow
          expiryRecheckPendingRef.current = true
          void syncSession().finally(() => {
            expiryRecheckPendingRef.current = false
          })
        }
        return
      }
      dismissRef.current.resetIfExpiryChanged(view?.kind ?? null, view?.expiresAtMs ?? null)
      const show =
        view != null &&
        dismissRef.current.shouldShow(view.kind, view.expiresAtMs, nowMs)
      setVisibleKind(show ? view.kind : null)
      setRemainingMs(view?.remainingMs ?? 0)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isAuthenticated, session, serverClockOffsetMs, syncSession])

  const dismissWarning = useCallback(() => {
    const nowMs = correctedNowMs(Date.now(), serverClockOffsetMs)
    const view = resolveSessionWarningView({ session: sessionRef.current, nowMs })
    if (view) dismissRef.current.dismiss(view.kind, view.expiresAtMs, nowMs)
    setVisibleKind(null)
    setExtendError(null)
  }, [serverClockOffsetMs])

  const extendIdleSession = useCallback(async () => {
    const requestedToken = useAuthStore.getState().token
    const isCurrent = () => Boolean(requestedToken) &&
      useAuthStore.getState().isAuthenticated &&
      useAuthStore.getState().token === requestedToken
    if (!isCurrent()) return
    setExtending(true)
    setExtendError(null)
    setSessionWarningActivitySuppressed(true)
    const previousIdle = sessionRef.current?.idleExpiresAt ?? null
    try {
      await postAdminAuthActivity()
      if (!isCurrent()) return
      const next = await getAdminAuthSession()
      if (!isCurrent()) return
      sessionRef.current = next
      setSession(next)
      const nowMs = correctedNowMs(Date.now(), applyServerClockOffset(0, next.serverNow, Date.now()))
      setServerClockOffsetMs(applyServerClockOffset(0, next.serverNow, Date.now()))
      if (isSessionIdleStillValid(next, nowMs, previousIdle)) {
        dismissRef.current.clear()
        setVisibleKind(null)
        setExtendError(null)
        return
      }
      setExtendError('세션을 연장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } catch (error) {
      if (!isCurrent()) return
      if (isAdminAuthUnauthorizedError(error)) {
        logout()
        return
      }
      if (isAdminAuthForbiddenError(error) || isAdminAuthRetryableTransportError(error)) {
        setExtendError('세션을 연장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setExtendError('세션을 연장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSessionWarningActivitySuppressed(false)
      setExtending(false)
    }
  }, [logout])

  return {
    showWarning: visibleKind != null,
    warningKind: visibleKind,
    countdown: Math.max(0, Math.ceil(remainingMs / 1000)),
    remainingMs,
    idlePolicyEnforced: session?.idlePolicyEnforced === true,
    absoluteExpiresAtMs: parseInstantMs(session?.absoluteExpiresAt),
    extendError,
    extending,
    dismissWarning,
    extendIdleSession,
    logout,
    syncSession,
  }
}
