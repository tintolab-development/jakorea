import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyServerClockOffset,
  correctedNowMs,
  createSessionWarningDismissState,
  isSessionIdleStillValid,
  parseInstantMs,
  readJwtSidClaim,
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
import { subscribeAdminActivityRecorded } from '@/features/auth/lib/admin-activity-signal'
import { setSessionWarningActivitySuppressed } from '@/features/auth/lib/session-keepalive'
import {
  REFRESH_COOKIE_SESSION_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from '@/features/auth/lib/refresh-credential'

const AUTH_USER_STORAGE_KEY = 'auth_user'

function readStoredUserId(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
      const id = (parsed as { id?: unknown }).id
      return typeof id === 'string' ? id : null
    }
  } catch {
    // 손상된 값은 다른 로그인으로 본다
  }
  return null
}

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
  /** 현재 session 상태를 받아 온 로그인 sid — 같은 로그인일 때만 조회 실패 시 이전 상태를 유지한다 */
  const sessionSidRef = useRef<string | null>(null)
  /** 유휴 경고 진입 직전 서버 재확인을 이미 한 유휴 기한 */
  const idleEntryCheckedForRef = useRef<number | null>(null)

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
      sessionSidRef.current = readJwtSidClaim(requestedToken)
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
      // 같은 로그인(sid)이면 마지막 서버 상태를 유지해 경고·만료 경계 재확인을 이어 간다.
      const sid = readJwtSidClaim(requestedToken)
      if (sid != null && sid === sessionSidRef.current) return
      sessionSidRef.current = null
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
      sessionSidRef.current = null
      idleEntryCheckedForRef.current = null
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

  // 전역 입력 Activity가 기록되면, 정책 ON일 때만 새 유휴 기한을 서버에서 다시 읽는다.
  // (다른 탭 활동·경고를 닫은 뒤 계속 작업한 경우 오래된 유휴 기한으로 경고가 다시 뜨지 않도록)
  useEffect(() => {
    if (!isAuthenticated) return
    return subscribeAdminActivityRecorded(() => {
      if (sessionRef.current?.idlePolicyEnforced) void syncSession()
    })
  }, [isAuthenticated, syncSession])

  useEffect(() => {
    if (!isAuthenticated) return
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void syncSession()
    }
    // access token은 탭 메모리에만 있다 (QA-0137). 다른 탭의 로그인·로그아웃은 저장된 사용자(auth_user)와
    // refresh 수단 키 변경으로만 알아채고, 다른 탭의 토큰을 가져다 쓰지 않는다.
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_USER_STORAGE_KEY) {
        if (event.newValue == null) {
          // Another tab logged out. Do not attempt a Session GET with a stale in-memory JWT.
          useAuthStore.getState().logout()
          return
        }
        if (readStoredUserId(event.newValue) !== useAuthStore.getState().user?.id) {
          // Different login identity: never keep the previous account's token/UI state.
          // Drop this tab's token and restore the new login via refresh (shared refresh credential).
          useAuthStore.setState({ token: null, expiresAt: null, isBootstrapping: true })
          void useAuthStore.getState().checkAuth()
        }
        return
      }
      if (event.key !== REFRESH_TOKEN_STORAGE_KEY && event.key !== REFRESH_COOKIE_SESSION_STORAGE_KEY) return
      // A sibling tab rotated the refresh credential of the same login session.
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
      // The warning view becomes null after an idle deadline has already passed.
      // Check that boundary explicitly instead of silently leaving an expired idle UI alive.
      const idleExpiresAtMs = session?.idlePolicyEnforced
        ? parseInstantMs(session.idleExpiresAt)
        : null
      if ((view && view.remainingMs <= 0) ||
          (idleExpiresAtMs != null && idleExpiresAtMs <= nowMs)) {
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
      // 유휴 경고 진입 직전 1회 서버 재확인 — 다른 탭 활동으로 이미 연장됐을 수 있다.
      if (view?.kind === 'idle' && idleEntryCheckedForRef.current !== view.expiresAtMs) {
        idleEntryCheckedForRef.current = view.expiresAtMs
        void syncSession()
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
