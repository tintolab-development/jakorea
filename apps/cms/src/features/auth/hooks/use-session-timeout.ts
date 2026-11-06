import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyServerClockOffset,
  correctedNowMs,
  createSessionWarningDismissState,
  isSessionIdleStillValid,
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

  const syncSession = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) return
    try {
      const next = await getAdminAuthSession()
      sessionRef.current = next
      setSession(next)
      setServerClockOffsetMs(previous =>
        applyServerClockOffset(previous, next.serverNow, Date.now())
      )
    } catch (error) {
      if (isAdminAuthUnauthorizedError(error) || isAdminAuthForbiddenError(error)) {
        logout()
        return
      }
      if (!isAdminAuthRetryableTransportError(error)) {
        logout()
      }
    }
  }, [logout])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    if (!isAuthenticated) {
      sessionRef.current = null
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
      if (event.key === 'auth_token' || event.key === 'auth_refresh_token') {
        void syncSession()
      }
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
        logout()
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
  }, [isAuthenticated, session, serverClockOffsetMs, logout])

  const dismissWarning = useCallback(() => {
    const nowMs = correctedNowMs(Date.now(), serverClockOffsetMs)
    const view = resolveSessionWarningView({ session: sessionRef.current, nowMs })
    if (view) dismissRef.current.dismiss(view.kind, view.expiresAtMs, nowMs)
    setVisibleKind(null)
    setExtendError(null)
  }, [serverClockOffsetMs])

  const extendIdleSession = useCallback(async () => {
    setExtending(true)
    setExtendError(null)
    setSessionWarningActivitySuppressed(true)
    const previousIdle = sessionRef.current?.idleExpiresAt ?? null
    try {
      await postAdminAuthActivity()
      const next = await getAdminAuthSession()
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
      if (isAdminAuthUnauthorizedError(error) || isAdminAuthForbiddenError(error)) {
        logout()
        return
      }
      if (isAdminAuthRetryableTransportError(error)) {
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
