import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyServerClockOffset,
  correctedNowMs,
  createSessionWarningDismissState,
  isSessionIdleStillValid,
  parseInstantMs,
  PLATFORM_SESSION_POLICY_DISPLAY,
  readJwtSidClaim,
  resolveSessionWarningView,
  type SessionWarningKind,
} from '@jakorea/domain/session'
import { DEV_AUTH_CHANGE_EVENT } from '@/shared/lib/auth-session-event'
import {
  getAccessToken,
  PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY,
  PLATFORM_AUTH_REFRESH_TOKEN_KEY,
  PLATFORM_AUTH_TOKEN_KEY,
} from '@/shared/lib/auth-token'
import {
  isSessionExpiredNoticePending,
  showSessionExpiredNotice,
} from '@/shared/lib/auth-restore-notice'
import {
  resetServerClockOffset,
  setServerClockOffsetMs as storeServerClockOffsetMs,
} from '@/shared/lib/server-clock'
import { startPortalActivityTracking } from './portal-activity-tracker'
import { logoutPortalSession } from './portal-logout'
import {
  getPortalMemberSession,
  isPortalSessionForbiddenError,
  isPortalSessionNotDeployedError,
  isPortalSessionUnauthorizedError,
  postPortalMemberActivity,
  type PortalMemberSessionResponse,
} from './portal-session-client'
import {
  isPortalSessionApiAvailable,
  markPortalSessionApiUnavailable,
  PORTAL_SESSION_BE_CONTRACT,
} from './portal-session-contract'

export type PortalSessionStatus = 'anonymous' | 'loading' | 'ready' | 'error' | 'unavailable'

const SIGN_IN_PATH = '/auth/sign-in'
/** 만료 경계 서버 재확인 최소 간격 */
const EXPIRY_RECHECK_INTERVAL_MS = 15_000
/** 탭 복귀·포커스 재조회 최소 간격 */
const RESUME_SYNC_INTERVAL_MS = 5_000

/** 같은 로그인 세션인지 — 동일 토큰이거나 같은 sid(Refresh 회전). sid는 UI 상태 참고값일 뿐 보안 판정이 아니다. */
function isSameLoginSession(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const sidA = readJwtSidClaim(a)
  return sidA != null && sidA === readJwtSidClaim(b)
}

function signInRedirectPath(): string {
  if (typeof window === 'undefined') return SIGN_IN_PATH
  const current = `${window.location.pathname}${window.location.search}`
  return `${SIGN_IN_PATH}?redirect=${encodeURIComponent(current)}`
}

/**
 * 포털 MEMBER 세션 경고 상태.
 * - 서버 `GET /api/portal/auth/session`이 정본. 로그인 직후·Refresh 후·다른 탭 교체·탭 복귀·새로고침 시 재조회
 * - `serverNow`로 시계 보정. FE 카운트다운은 경고 UI 전용 — 로컬 시간만으로 로그아웃하지 않는다
 * - `idlePolicyEnforced=false`면 유휴 경고 미표시. 12시간 절대 경고는 5분 전 표시하되 연장하지 않는다
 */
export function usePortalSessionTimeout() {
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken())
  const [session, setSession] = useState<PortalMemberSessionResponse | null>(null)
  const [status, setStatus] = useState<PortalSessionStatus>('anonymous')
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0)
  const [visibleKind, setVisibleKind] = useState<SessionWarningKind | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const [extending, setExtending] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)

  const dismissRef = useRef(createSessionWarningDismissState())
  const sessionRef = useRef<PortalMemberSessionResponse | null>(null)
  const offsetRef = useRef(0)
  const syncSequenceRef = useRef(0)
  const sidRef = useRef<string | null>(null)
  const extendingRef = useRef(false)
  const expiryRecheckPendingRef = useRef(false)
  const lastExpiryRecheckAtRef = useRef(0)
  const lastResumeSyncAtRef = useRef(0)
  const idleEntryCheckedForRef = useRef<number | null>(null)

  const activityTrackingEnabled =
    Boolean(accessToken) && status !== 'unavailable' && status !== 'anonymous'

  const applySession = useCallback((next: PortalMemberSessionResponse | null, offsetMs?: number) => {
    sessionRef.current = next
    setSession(next)
    if (offsetMs != null) {
      offsetRef.current = offsetMs
      setServerClockOffsetMs(offsetMs)
      // Axios 인터셉터(Session GET 401의 Access 만료 판단)도 서버 기준 시각을 쓰도록 모듈에 함께 저장한다.
      storeServerClockOffsetMs(offsetMs)
    }
  }, [])

  const logout = useCallback(() => {
    void logoutPortalSession({ redirectTo: SIGN_IN_PATH })
  }, [])

  /**
   * 서버 401로 세션 무효가 확정됐을 때만 호출한다.
   * 지금 화면에 머문 채 「자동으로 로그아웃되었어요.」를 띄우고 [확인] 때 로그아웃·로그인 화면으로 이동한다.
   */
  const endInvalidSession = useCallback(() => {
    setVisibleKind(null)
    showSessionExpiredNotice(() => {
      void logoutPortalSession({ redirectTo: signInRedirectPath() })
    })
  }, [])

  const syncSession = useCallback(async () => {
    const requestedToken = getAccessToken()
    if (!requestedToken || !isPortalSessionApiAvailable()) return
    const sequence = ++syncSequenceRef.current
    // 더 최신 요청이 있거나, 응답 도착 전 다른 로그인 sid로 바뀌었으면 결과를 버린다.
    const isCurrent = () =>
      syncSequenceRef.current === sequence && isSameLoginSession(requestedToken, getAccessToken())

    if (!sessionRef.current) setStatus('loading')
    try {
      const next = await getPortalMemberSession()
      if (!isCurrent()) return
      applySession(next, applyServerClockOffset(offsetRef.current, next.serverNow, Date.now()))
      setStatus('ready')
    } catch (error) {
      if (!isCurrent()) return
      if (isPortalSessionUnauthorizedError(error)) {
        // Axios가 Access 만료 시 허용된 단일 Refresh/재조회를 이미 수행했다. 서버 401 확정 → 재로그인.
        endInvalidSession()
        return
      }
      if (isPortalSessionNotDeployedError(error)) {
        markPortalSessionApiUnavailable('GET /api/portal/auth/session 404')
        applySession(null)
        setStatus('unavailable')
        return
      }
      if (isPortalSessionForbiddenError(error)) {
        // ADMIN JWT 등 잘못된 인증 영역. Refresh로 우회하지 않고 설정/계정 오류로 남긴다.
        console.warn('[portal-session] 403 PERMISSION_DENIED — MEMBER 토큰이 아닙니다.')
      }
      // 네트워크·5xx·잘못된 응답: 인증 폐기의 증거가 아니므로 이전 서버 상태를 유지한다.
      setStatus('error')
    }
  }, [applySession, endInvalidSession])

  const scheduleExpiryRecheck = useCallback(() => {
    const clientNow = Date.now()
    if (expiryRecheckPendingRef.current) return
    if (clientNow - lastExpiryRecheckAtRef.current < EXPIRY_RECHECK_INTERVAL_MS) return
    lastExpiryRecheckAtRef.current = clientNow
    expiryRecheckPendingRef.current = true
    void syncSession().finally(() => {
      expiryRecheckPendingRef.current = false
    })
  }, [syncSession])

  // 같은 탭(setAuthTokens/clearAuthTokens)·다른 탭(BroadcastChannel → auth-token이 platform:dev-auth-change로 전달,
  // storage: refresh 수단 제거) 토큰 변경 구독. access token은 메모리에만 있다 (QA-0137).
  useEffect(() => {
    const readToken = () => setAccessToken(getAccessToken())
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === PLATFORM_AUTH_TOKEN_KEY ||
        event.key === PLATFORM_AUTH_REFRESH_TOKEN_KEY ||
        event.key === PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY
      ) {
        readToken()
      }
    }
    window.addEventListener(DEV_AUTH_CHANGE_EVENT, readToken)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(DEV_AUTH_CHANGE_EVENT, readToken)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // 로그인·Refresh·교체 시 서버 재조회. 다른 sid면 이전 세션 상태를 즉시 폐기한다.
  useEffect(() => {
    if (!accessToken) {
      syncSequenceRef.current += 1
      sidRef.current = null
      idleEntryCheckedForRef.current = null
      expiryRecheckPendingRef.current = false
      lastExpiryRecheckAtRef.current = 0
      applySession(null)
      resetServerClockOffset()
      setStatus('anonymous')
      setVisibleKind(null)
      setRemainingMs(0)
      setExtendError(null)
      dismissRef.current.clear()
      return
    }
    const sid = readJwtSidClaim(accessToken)
    if (sid == null || sid !== sidRef.current) {
      sidRef.current = sid
      idleEntryCheckedForRef.current = null
      applySession(null)
      setVisibleKind(null)
      setExtendError(null)
      dismissRef.current.clear()
    }
    void syncSession()
  }, [accessToken, applySession, syncSession])

  // 탭 복귀·포커스: 백그라운드 타이머 연속성에 의존하지 않고 즉시 서버 재확인 (Activity 아님)
  useEffect(() => {
    if (!accessToken) return
    const resume = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastResumeSyncAtRef.current < RESUME_SYNC_INTERVAL_MS) return
      lastResumeSyncAtRef.current = now
      void syncSession()
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('focus', resume)
    return () => {
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('focus', resume)
    }
  }, [accessToken, syncSession])

  // 실제 사용자 활동 → Activity POST (45초 throttle). 401은 Refresh·재POST 없이 Session GET으로 판정.
  useEffect(() => {
    if (!activityTrackingEnabled) return
    return startPortalActivityTracking({
      // 연장 처리 중이거나 세션 종료 안내가 떠 있으면 Activity를 보내지 않는다
      isSuppressed: () => extendingRef.current || isSessionExpiredNoticePending(),
      onNetworkActivity: () => {
        postPortalMemberActivity()
          .then(() => {
            // 유휴 정책 ON일 때만 새 유휴 기한을 서버에서 다시 읽는다. updated=false를 연장 확정으로 보지 않는다.
            if (sessionRef.current?.idlePolicyEnforced) void syncSession()
          })
          .catch((error: unknown) => {
            if (isPortalSessionUnauthorizedError(error)) {
              scheduleExpiryRecheck()
              return
            }
            if (isPortalSessionNotDeployedError(error)) {
              markPortalSessionApiUnavailable('POST /api/portal/auth/activity 404')
              setStatus('unavailable')
            }
          })
      },
    })
  }, [activityTrackingEnabled, syncSession, scheduleExpiryRecheck])

  // 경고 표시 tick (서버 보정 시각 기준)
  useEffect(() => {
    if (!accessToken || !session) {
      setVisibleKind(null)
      setRemainingMs(0)
      return
    }
    const tick = () => {
      // 세션 종료 안내가 떠 있으면 유휴 경고는 띄우지 않는다
      if (isSessionExpiredNoticePending()) {
        setVisibleKind(null)
        return
      }
      const nowMs = correctedNowMs(Date.now(), serverClockOffsetMs)
      const view = resolveSessionWarningView({ session, nowMs })
      const idleExpiresAtMs = session.idlePolicyEnforced
        ? parseInstantMs(session.idleExpiresAt)
        : null

      // 만료 경계: 클라이언트 타이머는 서버 판정이 아니다. GET Session 재확인 후 401일 때만 종료.
      if ((view && view.remainingMs <= 0) || (idleExpiresAtMs != null && idleExpiresAtMs <= nowMs)) {
        scheduleExpiryRecheck()
        return
      }

      // 유휴 경고 진입 직전 1회 서버 재확인 — 다른 탭 활동으로 이미 연장됐을 수 있다.
      if (view?.kind === 'idle' && idleEntryCheckedForRef.current !== view.expiresAtMs) {
        idleEntryCheckedForRef.current = view.expiresAtMs
        void syncSession()
        return
      }

      dismissRef.current.resetIfExpiryChanged(view?.kind ?? null, view?.expiresAtMs ?? null)
      const show = view != null && dismissRef.current.shouldShow(view.kind, view.expiresAtMs, nowMs)
      setVisibleKind(show ? view.kind : null)
      setRemainingMs(view?.remainingMs ?? 0)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [accessToken, session, serverClockOffsetMs, scheduleExpiryRecheck, syncSession])

  /** 절대 만료 경고 '확인' — 표시만 닫는다(Refresh·Activity로 12시간 한도 연장 시도 없음). */
  const dismissWarning = useCallback(() => {
    const nowMs = correctedNowMs(Date.now(), offsetRef.current)
    const view = resolveSessionWarningView({ session: sessionRef.current, nowMs })
    if (view) dismissRef.current.dismiss(view.kind, view.expiresAtMs, nowMs)
    setVisibleKind(null)
    setExtendError(null)
  }, [])

  /**
   * 유휴 경고 '로그인 연장' — 사용자 클릭에서만 호출.
   * Activity POST 1회 → Session GET → 서버 idleExpiresAt이 경고 구간을 벗어났는지 검증.
   */
  const extendIdleSession = useCallback(async (): Promise<boolean> => {
    if (extendingRef.current) return false
    const requestedToken = getAccessToken()
    if (!requestedToken) return false
    const isCurrent = () => isSameLoginSession(requestedToken, getAccessToken())

    extendingRef.current = true
    setExtending(true)
    setExtendError(null)
    const previousIdle = sessionRef.current?.idleExpiresAt ?? null
    try {
      try {
        await postPortalMemberActivity()
      } catch (error) {
        if (!isCurrent()) return false
        if (isPortalSessionUnauthorizedError(error)) {
          // Activity 401: Refresh·재POST 금지. 세션 유효성은 Session GET(단발 Refresh 규칙)으로 확인한다.
          await syncSession()
        }
        setExtendError(PLATFORM_SESSION_POLICY_DISPLAY.idleExtendError)
        return false
      }
      if (!isCurrent()) return false

      const next = await getPortalMemberSession()
      if (!isCurrent()) return false
      const offsetMs = applyServerClockOffset(offsetRef.current, next.serverNow, Date.now())
      applySession(next, offsetMs)
      setStatus('ready')

      if (isSessionIdleStillValid(next, correctedNowMs(Date.now(), offsetMs), previousIdle)) {
        dismissRef.current.clear()
        setVisibleKind(null)
        return true
      }
      setExtendError(PLATFORM_SESSION_POLICY_DISPLAY.idleExtendError)
      return false
    } catch (error) {
      if (!isCurrent()) return false
      if (isPortalSessionUnauthorizedError(error)) {
        endInvalidSession()
        return false
      }
      setExtendError(PLATFORM_SESSION_POLICY_DISPLAY.idleExtendError)
      return false
    } finally {
      extendingRef.current = false
      setExtending(false)
    }
  }, [applySession, endInvalidSession, syncSession])

  return {
    showWarning: visibleKind != null,
    warningKind: visibleKind,
    countdown: Math.max(0, Math.ceil(remainingMs / 1000)),
    status,
    idlePolicyEnforced: session?.idlePolicyEnforced === true,
    extending,
    extendError,
    contract: PORTAL_SESSION_BE_CONTRACT,
    dismissWarning,
    extendIdleSession,
    logout,
    syncSession,
  }
}
